"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { uid, formatDate, parseMarkdown } from "@/lib/utils";
import type { Note } from "@/lib/types";

export default function Notes() {
  const { state, dispatch } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const selected = state.notes.find((n) => n.id === selectedId);

  const folders = useMemo(() => {
    const set = new Set(state.notes.map((n) => n.folder));
    return Array.from(set).sort();
  }, [state.notes]);

  const filtered = useMemo(() => {
    let notes = state.notes;
    if (activeFolder) notes = notes.filter((n) => n.folder === activeFolder);
    if (search) {
      const q = search.toLowerCase();
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return notes.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [state.notes, activeFolder, search]);

  const createNote = () => {
    const note: Note = {
      id: uid(),
      title: "Untitled Note",
      content: "",
      folder: activeFolder || "General",
      tags: [],
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_NOTE", payload: note });
    setSelectedId(note.id);
    setPreview(false);
  };

  const updateNote = (updates: Partial<Note>) => {
    if (!selected) return;
    dispatch({
      type: "UPDATE_NOTE",
      payload: { ...selected, ...updates, updatedAt: new Date().toISOString() },
    });
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-100px)] animate-fadeIn">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 flex flex-col bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="p-2 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveFolder(null)}
            className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
              !activeFolder ? "bg-indigo-500/10 text-indigo-500" : "hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
            }`}
          >
            All Notes ({state.notes.length})
          </button>
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFolder(f)}
              className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeFolder === f ? "bg-indigo-500/10 text-indigo-500" : "hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
              }`}
            >
              📁 {f} ({state.notes.filter((n) => n.folder === f).length})
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                setSelectedId(n.id);
                setPreview(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                selectedId === n.id
                  ? "bg-indigo-500/10 border border-indigo-500/20"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {n.pinned && <span className="text-xs">📌</span>}
                <div className="text-sm font-medium truncate">{n.title || "Untitled"}</div>
              </div>
              <div className="text-xs text-neutral-500 mt-0.5 truncate">
                {n.content.slice(0, 60) || "Empty note..."}
              </div>
              <div className="text-xs text-neutral-400 mt-1">{formatDate(n.updatedAt)}</div>
            </button>
          ))}
        </div>

        <div className="p-2 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={createNote}
            className="w-full py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            + New Note
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden flex flex-col">
        {selected ? (
          <>
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
              <input
                type="text"
                value={selected.title}
                onChange={(e) => updateNote({ title: e.target.value })}
                className="text-lg font-semibold bg-transparent outline-none flex-1"
                placeholder="Note title..."
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreview(!preview)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    preview ? "bg-indigo-500 text-white" : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {preview ? "Edit" : "Preview"}
                </button>
                <button
                  onClick={() => updateNote({ pinned: !selected.pinned })}
                  className={`p-1.5 rounded-lg transition-colors ${
                    selected.pinned ? "text-amber-500 bg-amber-500/10" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  }`}
                  title={selected.pinned ? "Unpin" : "Pin"}
                >
                  📌
                </button>
                <select
                  value={selected.folder}
                  onChange={(e) => updateNote({ folder: e.target.value })}
                  className="text-xs bg-neutral-100 dark:bg-neutral-800 border-none rounded-lg px-2 py-1.5 outline-none"
                >
                  {folders.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                  <option value="__new">+ New folder</option>
                </select>
                <button
                  onClick={() => {
                    if (confirm("Delete this note?")) {
                      dispatch({ type: "DELETE_NOTE", payload: selected.id });
                      setSelectedId(null);
                    }
                  }}
                  className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2 flex-wrap">
              {selected.tags.map((tag) => (
                <span key={tag} className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded flex items-center gap-1">
                  {tag}
                  <button onClick={() => updateNote({ tags: selected.tags.filter((t) => t !== tag) })} className="hover:text-red-400">×</button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tag..."
                className="text-xs bg-transparent outline-none flex-1 min-w-[80px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val && !selected.tags.includes(val)) {
                      updateNote({ tags: [...selected.tags, val] });
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
            </div>

            <div className="flex-1 overflow-hidden">
              {preview ? (
                <div
                  className="h-full overflow-y-auto p-6 prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(selected.content) }}
                />
              ) : (
                <textarea
                  value={selected.content}
                  onChange={(e) => updateNote({ content: e.target.value })}
                  placeholder="Start writing... (Markdown supported)"
                  className="w-full h-full p-6 bg-transparent outline-none resize-none text-sm font-mono leading-relaxed"
                />
              )}
            </div>

            <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
              <span>{selected.content.length} chars</span>
              <span>Last edited: {formatDate(selected.updatedAt)}</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-500">
            <div className="text-center">
              <div className="text-4xl mb-3">📝</div>
              <div className="text-sm">Select a note or create a new one</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
