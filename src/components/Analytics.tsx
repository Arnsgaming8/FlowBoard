"use client";

import { useState, useEffect, useMemo, startTransition } from "react";
import { useApp } from "@/lib/store";
import { exportCSV } from "@/lib/utils";
import { PRIORITY_COLORS } from "@/lib/types";

export default function Analytics() {
  const { state } = useApp();
  const [mounted, setMounted] = useState(false);
  useEffect(() => startTransition(() => setMounted(true)), []);

  const allTasks = state.boards.flatMap((b) => b.columns.flatMap((c) => c.tasks));
  const completed = allTasks.filter((t) => t.completedAt);
  const pending = allTasks.filter((t) => !t.completedAt);

  // Priority distribution
  const priorityData = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    allTasks.forEach((t) => counts[t.priority]++);
    return Object.entries(counts).map(([key, value]) => ({
      label: key,
      value,
      color: PRIORITY_COLORS[key as keyof typeof PRIORITY_COLORS],
    }));
  }, [allTasks]);

  // Completion rate by board
  const boardData = useMemo(() => {
    return state.boards.map((b) => {
      const total = b.columns.reduce((s, c) => s + c.tasks.length, 0);
      const done = b.columns.find((c) => c.title.toLowerCase() === "done")?.tasks.length ?? 0;
      return { name: b.name, total, done, rate: total > 0 ? (done / total) * 100 : 0 };
    });
  }, [state.boards]);

  // Tasks per day (last 14 days)
  const dailyData = useMemo(() => {
    if (!mounted) return Array.from({ length: 14 }, (_, i) => ({ date: "", day: "", created: 0, completed: 0 }));
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const dayStr = d.toISOString().slice(0, 10);
      const created = allTasks.filter((t) => t.createdAt.startsWith(dayStr)).length;
      const comp = completed.filter((t) => t.completedAt?.startsWith(dayStr)).length;
      return { date: dayStr, day: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }), created, completed: comp };
    });
  }, [allTasks, completed, mounted]);

  const maxDaily = Math.max(...dailyData.map((d) => Math.max(d.created, d.completed)), 1);

  // Pomodoro data (last 7 days)
  const pomodoroData = useMemo(() => {
    if (!mounted) return Array.from({ length: 7 }, () => ({ day: "", minutes: 0 }));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toISOString().slice(0, 10);
      const sessions = state.pomodoroSessions.filter((s) => s.completedAt.startsWith(dayStr) && s.type === "work");
      return {
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        minutes: sessions.reduce((s, p) => s + p.duration / 60, 0),
      };
    });
  }, [state.pomodoroSessions, mounted]);
  const maxPomodoro = Math.max(...pomodoroData.map((d) => d.minutes), 1);

  // Tag distribution
  const tagData = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    allTasks.forEach((t) => t.tags.forEach((tag) => (tagCounts[tag] = (tagCounts[tag] || 0) + 1)));
    state.notes.forEach((n) => n.tags.forEach((tag) => (tagCounts[tag] = (tagCounts[tag] || 0) + 1)));
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [allTasks, state.notes]);

  // Notes per folder
  const folderData = useMemo(() => {
    const counts: Record<string, number> = {};
    state.notes.forEach((n) => (counts[n.folder] = (counts[n.folder] || 0) + 1));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [state.notes]);

  // Calendar events per month
  const eventData = useMemo(() => {
    const counts: Record<string, number> = {};
    state.events.forEach((e) => {
      const month = e.date.slice(0, 7);
      counts[month] = (counts[month] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6);
  }, [state.events]);

  const exportTasks = () => {
    const rows = allTasks.map((t) => ({
      title: t.title,
      priority: t.priority,
      tags: t.tags.join("; "),
      dueDate: t.dueDate || "",
      createdAt: t.createdAt,
      completedAt: t.completedAt || "",
      status: t.completedAt ? "done" : "pending",
    }));
    exportCSV(rows, "tasks-export.csv");
  };

  const donutRadius = 50;
  const donutCircumference = 2 * Math.PI * donutRadius;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <button
          onClick={exportTasks}
          className="px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", value: allTasks.length, sub: `${completed.length} completed` },
          { label: "Completion Rate", value: `${allTasks.length > 0 ? Math.round((completed.length / allTasks.length) * 100) : 0}%`, sub: `${pending.length} remaining` },
          { label: "Total Notes", value: state.notes.length, sub: `${folderData.length} folders` },
          { label: "Focus Time", value: `${Math.round(state.pomodoroSessions.filter((s) => s.type === "work").reduce((s, p) => s + p.duration / 60, 0))}m`, sub: `${state.pomodoroSessions.filter((s) => s.type === "work").length} sessions` },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-neutral-500">{s.label}</div>
            <div className="text-xs text-neutral-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Priority donut */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Task Priority Distribution</h3>
          {allTasks.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm text-neutral-500">No tasks yet</div>
          ) : (
            <div className="flex items-center gap-8">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                {(() => {
                  let offset = 0;
                  return priorityData.map((d, i) => {
                    const pct = allTasks.length > 0 ? d.value / allTasks.length : 0;
                    const dash = pct * donutCircumference;
                    const gap = donutCircumference - dash;
                    const el = (
                      <circle
                        key={d.label}
                        cx="60"
                        cy="60"
                        r={donutRadius}
                        fill="none"
                        stroke={d.color}
                        strokeWidth="16"
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={-offset}
                      />
                    );
                    offset += dash;
                    return el;
                  });
                })()}
              </svg>
              <div className="space-y-3">
                {priorityData.map((d) => (
                  <div key={d.label} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-sm capitalize">{d.label}</span>
                    <span className="text-sm text-neutral-500 ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Board completion */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Board Completion</h3>
          {boardData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm text-neutral-500">No boards yet</div>
          ) : (
            <div className="space-y-4">
              {boardData.map((b) => (
                <div key={b.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{b.name}</span>
                    <span className="text-neutral-500">{b.done}/{b.total}</span>
                  </div>
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${b.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily activity (grouped bar) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Task Activity (14 Days)</h3>
          {allTasks.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm text-neutral-500">No activity yet</div>
          ) : (
            <div>
              <div className="flex items-end gap-1 h-40">
                {dailyData.map((d, i) => (
                  <div key={i} className="flex-1 flex gap-0.5 items-end h-full">
                    <div
                      className="flex-1 bg-blue-500/60 rounded-t-sm transition-all duration-500"
                      style={{ height: `${(d.created / maxDaily) * 100}%`, minHeight: d.created > 0 ? "2px" : "0" }}
                      title={`Created: ${d.created}`}
                    />
                    <div
                      className="flex-1 bg-green-500/60 rounded-t-sm transition-all duration-500"
                      style={{ height: `${(d.completed / maxDaily) * 100}%`, minHeight: d.completed > 0 ? "2px" : "0" }}
                      title={`Completed: ${d.completed}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mt-1">
                {dailyData.map((d, i) => (
                  <div key={i} className="flex-1 text-center">
                    <span className="text-[9px] text-neutral-500">{d.day.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-blue-500/60 rounded-sm" />
                  <span className="text-xs text-neutral-500">Created</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-green-500/60 rounded-sm" />
                  <span className="text-xs text-neutral-500">Completed</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Focus time chart */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Focus Time (7 Days)</h3>
          <div className="flex items-end gap-2 h-32">
            {pomodoroData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end h-24">
                  <div
                    className="w-full max-w-[30px] bg-red-500/70 rounded-t-md transition-all duration-500"
                    style={{ height: `${(d.minutes / maxPomodoro) * 100}%`, minHeight: d.minutes > 0 ? "4px" : "0" }}
                  />
                </div>
                <span className="text-[10px] text-neutral-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tag cloud */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Top Tags</h3>
          {tagData.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-sm text-neutral-500">No tags yet</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tagData.map(([tag, count]) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 text-sm font-medium"
                  style={{ fontSize: `${Math.max(12, Math.min(18, 12 + count))}px` }}
                >
                  {tag} ({count})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes by folder */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Notes by Folder</h3>
          {folderData.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-sm text-neutral-500">No notes yet</div>
          ) : (
            <div className="space-y-2">
              {folderData.map(([folder, count]) => (
                <div key={folder} className="flex items-center gap-3">
                  <span className="text-sm flex-1 truncate">📁 {folder}</span>
                  <span className="text-sm text-neutral-500">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calendar heatmap (simplified) */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Upcoming Events</h3>
          {eventData.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-sm text-neutral-500">No events yet</div>
          ) : (
            <div className="space-y-2">
              {eventData.map(([month, count]) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-sm w-20">{month}</span>
                  <div className="flex-1 h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500/60 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (count / Math.max(...eventData.map((e) => e[1]))) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-neutral-500 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
