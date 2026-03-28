"use client";

import { useState, useEffect, useRef, useCallback, useMemo, startTransition } from "react";
import { useApp } from "@/lib/store";
import { uid, exportData } from "@/lib/utils";
import { DEFAULT_COLUMNS } from "@/lib/types";

interface Command {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  category: string;
}

export default function CommandPalette() {
  const { state, dispatch, setView } = useApp();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: Command[] = useMemo(
    () => [
      { id: "dashboard", label: "Go to Dashboard", icon: "📊", action: () => setView("dashboard"), category: "Navigation" },
      { id: "kanban", label: "Go to Kanban", icon: "📋", action: () => setView("kanban"), category: "Navigation" },
      { id: "notes", label: "Go to Notes", icon: "📝", action: () => setView("notes"), category: "Navigation" },
      { id: "calendar", label: "Go to Calendar", icon: "📅", action: () => setView("calendar"), category: "Navigation" },
      { id: "pomodoro", label: "Go to Pomodoro", icon: "⏱️", action: () => setView("pomodoro"), category: "Navigation" },
      { id: "analytics", label: "Go to Analytics", icon: "📈", action: () => setView("analytics"), category: "Navigation" },
      {
        id: "new-board",
        label: "Create New Board",
        icon: "➕",
        action: () => {
          const name = prompt("Board name:");
          if (name) {
            dispatch({
              type: "ADD_BOARD",
              payload: { id: uid(), name, columns: DEFAULT_COLUMNS.map((c) => ({ ...c, id: uid(), tasks: [] })), createdAt: new Date().toISOString() },
            });
            setView("kanban");
          }
        },
        category: "Actions",
      },
      {
        id: "new-note",
        label: "Create New Note",
        icon: "📄",
        action: () => {
          dispatch({
            type: "ADD_NOTE",
            payload: { id: uid(), title: "Untitled Note", content: "", folder: "General", tags: [], pinned: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          });
          setView("notes");
        },
        category: "Actions",
      },
      {
        id: "toggle-dark",
        label: state.darkMode ? "Switch to Light Mode" : "Switch to Dark Mode",
        icon: state.darkMode ? "☀️" : "🌙",
        action: () => dispatch({ type: "TOGGLE_DARK_MODE" }),
        category: "Settings",
      },
      {
        id: "export",
        label: "Export All Data",
        icon: "💾",
        action: () => {
          const { commandPaletteOpen: _, ...data } = state;
          exportData(data);
        },
        category: "Data",
      },
    ],
    [state, dispatch, setView]
  );

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const close = useCallback(() => {
    dispatch({ type: "TOGGLE_COMMAND_PALETTE" });
    setQuery("");
    startTransition(() => setSelectedIndex(0));
  }, [dispatch]);

  useEffect(() => {
    if (state.commandPaletteOpen) {
      inputRef.current?.focus();
      startTransition(() => setSelectedIndex(0));
    }
  }, [state.commandPaletteOpen]);

  useEffect(() => {
    startTransition(() => setSelectedIndex(0));
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        dispatch({ type: "TOGGLE_COMMAND_PALETTE" });
      }
      if (e.key === "Escape" && state.commandPaletteOpen) {
        close();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.commandPaletteOpen, close, dispatch]);

  if (!state.commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]" onClick={close}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-neutral-200 dark:border-neutral-700">
          <svg className="w-5 h-5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && filtered[selectedIndex]) {
                filtered[selectedIndex].action();
                close();
              }
            }}
            placeholder="Type a command..."
            className="flex-1 bg-transparent px-3 py-4 text-sm outline-none placeholder:text-neutral-400"
          />
        </div>
        <div ref={listRef} className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-neutral-500">No commands found</div>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => {
                cmd.action();
                close();
              }}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                i === selectedIndex
                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <span className="text-base">{cmd.icon}</span>
              <span className="flex-1 text-left">{cmd.label}</span>
              <span className="text-xs text-neutral-400">{cmd.category}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
