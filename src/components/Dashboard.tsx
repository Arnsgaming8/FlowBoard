"use client";

import { useState, useEffect, useMemo, startTransition } from "react";
import { useApp } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { PRIORITY_COLORS } from "@/lib/types";
import type { Task } from "@/lib/types";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => startTransition(() => setMounted(true)), []);
  return mounted;
}

export default function Dashboard() {
  const { state, dispatch, setView } = useApp();
  const mounted = useMounted();

  const allTasks = state.boards.flatMap((b) => b.columns.flatMap((c) => c.tasks));
  const completedTasks = allTasks.filter((t) => t.completedAt);
  const pendingTasks = allTasks.filter((t) => !t.completedAt);
  const highPriority = pendingTasks.filter((t) => t.priority === "high");

  const { overdueTasks, todayEvents, tasksPerDay, maxPerDay, last7Days } = useMemo(() => {
    if (!mounted) {
      return { overdueTasks: [], todayEvents: [], tasksPerDay: [0, 0, 0, 0, 0, 0, 0], maxPerDay: 1, last7Days: [] as string[] };
    }
    const now = new Date();
    const todayStart = new Date(now.toDateString());
    const overdue = pendingTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < todayStart
    );
    const todayStr = now.toISOString().slice(0, 10);
    const events = state.events.filter((e) => e.date === todayStr);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    const perDay = days.map(
      (day) => completedTasks.filter((t) => t.completedAt?.startsWith(day)).length
    );
    const max = Math.max(...perDay, 1);
    return { overdueTasks: overdue, todayEvents: events, tasksPerDay: perDay, maxPerDay: max, last7Days: days };
  }, [mounted, pendingTasks, state.events, completedTasks]);

  const recentNotes = [...state.notes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const recentCompleted = completedTasks
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 5);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Welcome back. Here&apos;s your overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", value: allTasks.length, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Completed", value: completedTasks.length, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "In Progress", value: pendingTasks.length, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "High Priority", value: highPriority.length, color: "text-red-500", bg: "bg-red-500/10" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Tasks Completed (Last 7 Days)</h3>
        <div className="flex items-end gap-2 h-32">
          {tasksPerDay.map((count, i) => {
            const label = last7Days[i]
              ? weekDays[new Date(last7Days[i]).getDay()]
              : "\u00a0";
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end h-24">
                  <div
                    className="w-full max-w-[40px] bg-indigo-500/80 rounded-t-md transition-all duration-500"
                    style={{ height: `${(count / maxPerDay) * 100}%`, minHeight: count > 0 ? "4px" : "0" }}
                  />
                </div>
                <span className="text-xs text-neutral-500">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-red-500 mb-3">
              Overdue ({overdueTasks.length})
            </h3>
            <div className="space-y-2">
              {overdueTasks.slice(0, 5).map((t) => (
                <TaskItem key={t.id} task={t} />
              ))}
            </div>
          </div>
        )}

        {/* Today's events */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Today&apos;s Events</h3>
            <button
              onClick={() => setView("calendar")}
              className="text-xs text-indigo-500 hover:text-indigo-400"
            >
              View all
            </button>
          </div>
          {todayEvents.length === 0 ? (
            <p className="text-sm text-neutral-500">No events today</p>
          ) : (
            <div className="space-y-2">
              {todayEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                  <div>
                    <div className="text-sm font-medium">{e.title}</div>
                    {e.time && <div className="text-xs text-neutral-500">{e.time}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent notes */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Recent Notes</h3>
            <button
              onClick={() => setView("notes")}
              className="text-xs text-indigo-500 hover:text-indigo-400"
            >
              View all
            </button>
          </div>
          {recentNotes.length === 0 ? (
            <p className="text-sm text-neutral-500">No notes yet</p>
          ) : (
            <div className="space-y-2">
              {recentNotes.map((n) => (
                <div key={n.id} className="px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                  <div className="text-sm font-medium truncate">{n.title || "Untitled"}</div>
                  <div className="text-xs text-neutral-500">{formatDate(n.updatedAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">Recently Completed</h3>
          {recentCompleted.length === 0 ? (
            <p className="text-sm text-neutral-500">No completed tasks yet</p>
          ) : (
            <div className="space-y-2">
              {recentCompleted.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    <div className="text-xs text-neutral-500">{formatDate(t.completedAt!)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Board summary */}
      {state.boards.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Boards</h3>
            <button
              onClick={() => setView("kanban")}
              className="text-xs text-indigo-500 hover:text-indigo-400"
            >
              Open Kanban
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {state.boards.map((b) => {
              const total = b.columns.reduce((s, c) => s + c.tasks.length, 0);
              const done = b.columns.find((c) => c.title.toLowerCase() === "done")?.tasks.length ?? 0;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    dispatch({ type: "SET_ACTIVE_BOARD", payload: b.id });
                    setView("kanban");
                  }}
                  className="text-left px-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="text-sm font-medium">{b.name}</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {done}/{total} completed
                  </div>
                  <div className="mt-2 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: total > 0 ? `${(done / total) * 100}%` : "0%" }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskItem({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/50 dark:bg-neutral-800/50">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{task.title}</div>
        {task.dueDate && (
          <div className="text-xs text-neutral-500">Due: {formatDate(task.dueDate)}</div>
        )}
      </div>
    </div>
  );
}
