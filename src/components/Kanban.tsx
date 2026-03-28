"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useApp } from "@/lib/store";
import { uid, formatDate } from "@/lib/utils";
import { DEFAULT_COLUMNS, PRIORITY_COLORS } from "@/lib/types";
import type { Board, Column, Task, Priority } from "@/lib/types";

export default function Kanban() {
  const { state, dispatch } = useApp();
  const [dragInfo, setDragInfo] = useState<{ taskId: string; fromCol: string } | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<{ boardId: string; columnId: string; task: Task; isNew?: boolean } | null>(null);
  const [addingTaskCol, setAddingTaskCol] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);

  const activeBoard = state.boards.find((b) => b.id === state.activeBoardId) || state.boards[0];

  const createBoard = () => {
    if (!newBoardName.trim()) return;
    const board: Board = {
      id: uid(),
      name: newBoardName.trim(),
      columns: DEFAULT_COLUMNS.map((c) => ({ ...c, id: uid(), tasks: [] })),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_BOARD", payload: board });
    dispatch({ type: "SET_ACTIVE_BOARD", payload: board.id });
    setNewBoardName("");
    setShowNewBoard(false);
  };

  const addTask = (columnId: string) => {
    if (!newTaskTitle.trim() || !activeBoard) return;
    const task: Task = {
      id: uid(),
      title: newTaskTitle.trim(),
      description: "",
      priority: "medium",
      tags: [],
      dueDate: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    dispatch({ type: "ADD_TASK", payload: { boardId: activeBoard.id, columnId, task } });
    setNewTaskTitle("");
    setAddingTaskCol(null);
    setEditingTask({ boardId: activeBoard.id, columnId, task, isNew: true });
  };

  const handleDragStart = (taskId: string, fromCol: string) => {
    setDragInfo({ taskId, fromCol });
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverCol(colId);
  };

  const handleDrop = (toCol: string, toIndex: number) => {
    if (!dragInfo || !activeBoard) return;
    dispatch({
      type: "MOVE_TASK",
      payload: {
        boardId: activeBoard.id,
        fromCol: dragInfo.fromCol,
        toCol,
        taskId: dragInfo.taskId,
        toIndex,
      },
    });
    setDragInfo(null);
    setDragOverCol(null);
  };

  const handleDragEnd = () => {
    setDragInfo(null);
    setDragOverCol(null);
  };

  if (state.boards.length === 0) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-2xl font-bold">Kanban Board</h2>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
          <p className="text-neutral-500 mb-6">Create your first board to start organizing tasks.</p>
          <button
            onClick={() => setShowNewBoard(true)}
            className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
          >
            Create Board
          </button>
        </div>

        {showNewBoard && (
          <BoardModal
            name={newBoardName}
            onNameChange={setNewBoardName}
            onSubmit={createBoard}
            onClose={() => setShowNewBoard(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={activeBoard?.id || ""}
            onChange={(e) => dispatch({ type: "SET_ACTIVE_BOARD", payload: e.target.value })}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-indigo-500"
          >
            {state.boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {activeBoard && (
            <button
              onClick={() => {
                if (confirm(`Delete board "${activeBoard.name}"?`)) {
                  dispatch({ type: "DELETE_BOARD", payload: activeBoard.id });
                }
              }}
              className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
              title="Delete board"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewBoard(true)}
            className="px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            + New Board
          </button>
          {activeBoard && (
            <button
              onClick={() => {
                const col: Column = { id: uid(), title: "New Column", tasks: [] };
                dispatch({ type: "ADD_COLUMN", payload: { boardId: activeBoard.id, column: col } });
              }}
              className="px-3 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              + Column
            </button>
          )}
        </div>
      </div>

      {activeBoard && (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2" style={{ minHeight: "calc(100vh - 200px)" }}>
          {activeBoard.columns.map((col) => (
            <div
              key={col.id}
              className={`flex-shrink-0 w-72 flex flex-col rounded-xl border transition-colors ${
                dragOverCol === col.id
                  ? "border-indigo-500/50 bg-indigo-500/5"
                  : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50"
              }`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(col.id, col.tasks.length);
              }}
            >
              <div className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-800">
                <input
                  className="text-sm font-semibold bg-transparent outline-none flex-1"
                  value={col.title}
                  onChange={(e) =>
                    dispatch({
                      type: "RENAME_COLUMN",
                      payload: { boardId: activeBoard.id, columnId: col.id, title: e.target.value },
                    })
                  }
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-neutral-500 bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded-full">
                    {col.tasks.length}
                  </span>
                  <button
                    onClick={() => {
                      if (col.tasks.length === 0 || confirm("Delete this column and all its tasks?")) {
                        dispatch({ type: "DELETE_COLUMN", payload: { boardId: activeBoard.id, columnId: col.id } });
                      }
                    }}
                    className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {col.tasks.map((task, idx) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id, col.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDrop(col.id, idx);
                    }}
                    onClick={() => setEditingTask({ boardId: activeBoard.id, columnId: col.id, task })}
                    className={`p-3 bg-white dark:bg-neutral-800 border rounded-lg cursor-pointer hover:shadow-md transition-all group ${
                      dragInfo?.taskId === task.id
                        ? "opacity-50 border-indigo-500/50"
                        : "border-neutral-200 dark:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-xs text-neutral-500 mt-1 line-clamp-2">
                            {task.description}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch({
                            type: "DELETE_TASK",
                            payload: { boardId: activeBoard.id, columnId: col.id, taskId: task.id },
                          });
                        }}
                        className="p-1 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {task.completedAt ? (
                        <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Done!
                        </span>
                      ) : (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                          title={task.priority}
                        />
                      )}
                      {task.dueDate && (
                        <span className="text-xs text-neutral-500">{formatDate(task.dueDate)}</span>
                      )}
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-neutral-200 dark:border-neutral-800">
                {addingTaskCol === col.id ? (
                  <div className="space-y-2">
                    <input
                      ref={addInputRef}
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTask(col.id);
                        if (e.key === "Escape") setAddingTaskCol(null);
                      }}
                      placeholder="Task title..."
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => addTask(col.id)}
                        className="px-3 py-1.5 text-xs bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setAddingTaskCol(null)}
                        className="px-3 py-1.5 text-xs bg-neutral-200 dark:bg-neutral-700 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAddingTaskCol(col.id);
                      setNewTaskTitle("");
                    }}
                    className="w-full py-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    + Add task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit task modal */}
      {editingTask && (
        <TaskModal
          task={editingTask.task}
          isNew={editingTask.isNew}
          onSave={(task) => {
            dispatch({
              type: "UPDATE_TASK",
              payload: { boardId: editingTask.boardId, columnId: editingTask.columnId, task },
            });
            setEditingTask(null);
          }}
          onClose={() => setEditingTask(null)}
          onToggleComplete={() => {
            const updated = {
              ...editingTask.task,
              completedAt: editingTask.task.completedAt ? null : new Date().toISOString(),
            };
            dispatch({
              type: "UPDATE_TASK",
              payload: { boardId: editingTask.boardId, columnId: editingTask.columnId, task: updated },
            });
            setEditingTask(null);
          }}
        />
      )}

      {showNewBoard && (
        <BoardModal
          name={newBoardName}
          onNameChange={setNewBoardName}
          onSubmit={createBoard}
          onClose={() => setShowNewBoard(false)}
        />
      )}
    </div>
  );
}

function BoardModal({
  name,
  onNameChange,
  onSubmit,
  onClose,
}: {
  name: string;
  onNameChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 w-full max-w-md animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">New Board</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder="Board name..."
          className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-indigo-500 text-sm"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskModal({
  task,
  isNew,
  onSave,
  onClose,
  onToggleComplete,
}: {
  task: Task;
  isNew?: boolean;
  onSave: (task: Task) => void;
  onClose: () => void;
  onToggleComplete: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(task.tags);
  const [loading, setLoading] = useState(!!isNew);

  useEffect(() => {
    if (!isNew) return;
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [isNew]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-8 w-full max-w-lg animate-scaleIn flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-neutral-500">Preparing your task...</p>
        </div>
      </div>
    );
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const save = () => {
    onSave({ ...task, title, description, priority, dueDate: dueDate || null, tags });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 w-full max-w-lg animate-scaleIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Task</h3>
          <button
            onClick={onToggleComplete}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              task.completedAt
                ? "bg-green-500/10 text-green-500"
                : "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            }`}
          >
            {task.completedAt ? "✓ Completed" : "Mark Complete"}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-indigo-500 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-indigo-500 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Tags</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded flex items-center gap-1"
                >
                  {tag}
                  <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-red-400">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-indigo-500 text-sm"
              />
              <button
                onClick={addTag}
                className="px-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
