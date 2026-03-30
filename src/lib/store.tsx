"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
  useCallback,
} from "react";
import type { AppState, AppAction, View } from "./types";
import { loadData, saveData } from "./api";

const STORAGE_KEY = "flowboard-state";

const defaultState: AppState = {
  boards: [],
  notes: [],
  events: [],
  pomodoroSessions: [],
  quickLinks: [],
  darkMode: true,
  currentView: "dashboard",
  activeBoardId: null,
  sidebarOpen: true,
  commandPaletteOpen: false,
  searchQuery: "",
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "HYDRATE":
      return { ...action.payload };
    case "SET_VIEW":
      return { ...state, currentView: action.payload };
    case "TOGGLE_DARK_MODE":
      return { ...state, darkMode: !state.darkMode };
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case "TOGGLE_COMMAND_PALETTE":
      return { ...state, commandPaletteOpen: !state.commandPaletteOpen };
    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };
    case "ADD_BOARD":
      return { ...state, boards: [...state.boards, action.payload] };
    case "DELETE_BOARD":
      return {
        ...state,
        boards: state.boards.filter((b) => b.id !== action.payload),
        activeBoardId:
          state.activeBoardId === action.payload
            ? state.boards.length > 1
              ? state.boards.find((b) => b.id !== action.payload)?.id ?? null
              : null
            : state.activeBoardId,
      };
    case "SET_ACTIVE_BOARD":
      return { ...state, activeBoardId: action.payload };
    case "ADD_COLUMN":
      return {
        ...state,
        boards: state.boards.map((b) =>
          b.id === action.payload.boardId
            ? { ...b, columns: [...b.columns, action.payload.column] }
            : b
        ),
      };
    case "DELETE_COLUMN":
      return {
        ...state,
        boards: state.boards.map((b) =>
          b.id === action.payload.boardId
            ? { ...b, columns: b.columns.filter((c) => c.id !== action.payload.columnId) }
            : b
        ),
      };
    case "RENAME_COLUMN":
      return {
        ...state,
        boards: state.boards.map((b) =>
          b.id === action.payload.boardId
            ? {
                ...b,
                columns: b.columns.map((c) =>
                  c.id === action.payload.columnId ? { ...c, title: action.payload.title } : c
                ),
              }
            : b
        ),
      };
    case "ADD_TASK":
      return {
        ...state,
        boards: state.boards.map((b) =>
          b.id === action.payload.boardId
            ? {
                ...b,
                columns: b.columns.map((c) =>
                  c.id === action.payload.columnId
                    ? { ...c, tasks: [...c.tasks, action.payload.task] }
                    : c
                ),
              }
            : b
        ),
      };
    case "UPDATE_TASK":
      return {
        ...state,
        boards: state.boards.map((b) =>
          b.id === action.payload.boardId
            ? {
                ...b,
                columns: b.columns.map((c) =>
                  c.id === action.payload.columnId
                    ? {
                        ...c,
                        tasks: c.tasks.map((t) =>
                          t.id === action.payload.task.id ? action.payload.task : t
                        ),
                      }
                    : c
                ),
              }
            : b
        ),
      };
    case "DELETE_TASK":
      return {
        ...state,
        boards: state.boards.map((b) =>
          b.id === action.payload.boardId
            ? {
                ...b,
                columns: b.columns.map((c) =>
                  c.id === action.payload.columnId
                    ? { ...c, tasks: c.tasks.filter((t) => t.id !== action.payload.taskId) }
                    : c
                ),
              }
            : b
        ),
      };
    case "MOVE_TASK": {
      const { boardId, fromCol, toCol, taskId, toIndex } = action.payload;
      let movedTask: import("./types").Task | null = null;
      const boards = state.boards.map((b) => {
        if (b.id !== boardId) return b;
        const columns = b.columns.map((c) => {
          if (c.id === fromCol) {
            const task = c.tasks.find((t) => t.id === taskId);
            if (task) movedTask = task;
            return { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) };
          }
          return c;
        });
        if (movedTask) {
          const finalColumns = columns.map((c) => {
            if (c.id === toCol) {
              const tasks = [...c.tasks];
              tasks.splice(toIndex, 0, movedTask!);
              return { ...c, tasks };
            }
            return c;
          });
          return { ...b, columns: finalColumns };
        }
        return { ...b, columns };
      });
      return { ...state, boards };
    }
    case "ADD_NOTE":
      return { ...state, notes: [...state.notes, action.payload] };
    case "UPDATE_NOTE":
      return {
        ...state,
        notes: state.notes.map((n) => (n.id === action.payload.id ? action.payload : n)),
      };
    case "DELETE_NOTE":
      return { ...state, notes: state.notes.filter((n) => n.id !== action.payload) };
    case "ADD_EVENT":
      return { ...state, events: [...state.events, action.payload] };
    case "UPDATE_EVENT":
      return {
        ...state,
        events: state.events.map((e) => (e.id === action.payload.id ? action.payload : e)),
      };
    case "DELETE_EVENT":
      return { ...state, events: state.events.filter((e) => e.id !== action.payload) };
    case "ADD_POMODORO_SESSION":
      return { ...state, pomodoroSessions: [...state.pomodoroSessions, action.payload] };
    case "ADD_QUICK_LINK":
      return { ...state, quickLinks: [...state.quickLinks, action.payload] };
    case "DELETE_QUICK_LINK":
      return { ...state, quickLinks: state.quickLinks.filter((l) => l.id !== action.payload) };
    case "IMPORT_DATA":
      return { ...state, ...action.payload, commandPaletteOpen: false };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setView: (v: View) => void;
} | null>(null);

export function AppProvider({ children, token }: { children: ReactNode; token?: string | null }) {
  const [state, dispatch] = useReducer(appReducer, defaultState);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef(token);

  useEffect(() => { tokenRef.current = token; }, [token]);

  // Load from server on mount (if token), then fall back to localStorage
  useEffect(() => {
    async function init() {
      let hydrated = false;
      if (token) {
        try {
          const serverData = await loadData(token);
          if (serverData && typeof serverData === "object") {
            dispatch({ type: "HYDRATE", payload: { ...defaultState, ...serverData, commandPaletteOpen: false } });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
            hydrated = true;
          }
        } catch {
          // server unreachable, fall back to localStorage
        }
      }
      if (!hydrated) {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            dispatch({ type: "HYDRATE", payload: { ...defaultState, ...parsed, commandPaletteOpen: false } });
          }
        } catch {
          // ignore
        }
      }
    }
    init();
  }, [token]);

  // Save to localStorage + debounce save to server
  useEffect(() => {
    const { commandPaletteOpen: _, ...toSave } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));

    if (!tokenRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (tokenRef.current) {
        saveData(tokenRef.current, toSave).catch(() => {});
      }
    }, 2000);
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.darkMode);
  }, [state.darkMode]);

  const setView = useCallback((v: View) => dispatch({ type: "SET_VIEW", payload: v }), []);

  return (
    <AppContext.Provider value={{ state, dispatch, setView }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
