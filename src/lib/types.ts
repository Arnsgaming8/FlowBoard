export type View = "dashboard" | "kanban" | "notes" | "calendar" | "pomodoro" | "analytics";

export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ReminderMinutes = 0 | 5 | 15 | 30 | 60;

export const REMINDER_OPTIONS: { value: ReminderMinutes; label: string }[] = [
  { value: 0, label: "At time of event" },
  { value: 5, label: "5 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
];

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  color: string;
  description: string;
  reminderMinutes: ReminderMinutes;
}

export interface PomodoroSession {
  id: string;
  taskId: string;
  taskTitle: string;
  duration: number;
  type: "work" | "shortBreak" | "longBreak";
  completedAt: string;
}

export interface QuickLink {
  id: string;
  name: string;
  url: string;
}

export interface AppState {
  boards: Board[];
  notes: Note[];
  events: CalendarEvent[];
  pomodoroSessions: PomodoroSession[];
  quickLinks: QuickLink[];
  darkMode: boolean;
  currentView: View;
  activeBoardId: string | null;
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  searchQuery: string;
}

export type AppAction =
  | { type: "HYDRATE"; payload: AppState }
  | { type: "SET_VIEW"; payload: View }
  | { type: "TOGGLE_DARK_MODE" }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "TOGGLE_COMMAND_PALETTE" }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "ADD_BOARD"; payload: Board }
  | { type: "DELETE_BOARD"; payload: string }
  | { type: "SET_ACTIVE_BOARD"; payload: string }
  | { type: "ADD_COLUMN"; payload: { boardId: string; column: Column } }
  | { type: "DELETE_COLUMN"; payload: { boardId: string; columnId: string } }
  | { type: "RENAME_COLUMN"; payload: { boardId: string; columnId: string; title: string } }
  | { type: "ADD_TASK"; payload: { boardId: string; columnId: string; task: Task } }
  | { type: "UPDATE_TASK"; payload: { boardId: string; columnId: string; task: Task } }
  | { type: "DELETE_TASK"; payload: { boardId: string; columnId: string; taskId: string } }
  | { type: "MOVE_TASK"; payload: { boardId: string; fromCol: string; toCol: string; taskId: string; toIndex: number } }
  | { type: "ADD_NOTE"; payload: Note }
  | { type: "UPDATE_NOTE"; payload: Note }
  | { type: "DELETE_NOTE"; payload: string }
  | { type: "ADD_EVENT"; payload: CalendarEvent }
  | { type: "UPDATE_EVENT"; payload: CalendarEvent }
  | { type: "DELETE_EVENT"; payload: string }
  | { type: "ADD_POMODORO_SESSION"; payload: PomodoroSession }
  | { type: "ADD_QUICK_LINK"; payload: QuickLink }
  | { type: "DELETE_QUICK_LINK"; payload: string }
  | { type: "IMPORT_DATA"; payload: Partial<AppState> };

export const DEFAULT_COLUMNS: Column[] = [
  { id: "todo", title: "To Do", tasks: [] },
  { id: "in-progress", title: "In Progress", tasks: [] },
  { id: "review", title: "Review", tasks: [] },
  { id: "done", title: "Done", tasks: [] },
];

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

export const EVENT_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6"];
