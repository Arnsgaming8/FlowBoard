"use client";

import { useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/Toast";
import type { Board } from "@/lib/types";

const REMINDER_INTERVAL = 5 * 60 * 1000;
const SNOOZE_DURATION = 10 * 60 * 1000;

interface TaskReminderState {
  dismissed: boolean;
  snoozedUntil: number;
  lastNotified: number;
}

export function useHighPriorityReminders(boards: Board[]) {
  const { showToast, dismissToast } = useToast();
  const remindersRef = useRef<Map<string, TaskReminderState>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getHighPriorityTasks = useCallback(() => {
    const tasks: { taskId: string; title: string; boardName: string }[] = [];
    for (const board of boards) {
      for (const col of board.columns) {
        if (col.title.toLowerCase() === "done") continue;
        for (const task of col.tasks) {
          if (task.priority === "high" && !task.completedAt) {
            tasks.push({ taskId: task.id, title: task.title, boardName: board.name });
          }
        }
      }
    }
    return tasks;
  }, [boards]);

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const highPriorityTasks = getHighPriorityTasks();

      for (const { taskId, title, boardName } of highPriorityTasks) {
        let state = remindersRef.current.get(taskId);
        if (!state) {
          state = { dismissed: false, snoozedUntil: 0, lastNotified: 0 };
          remindersRef.current.set(taskId, state);
        }

        if (state.dismissed) continue;
        if (now < state.snoozedUntil) continue;
        if (now - state.lastNotified < REMINDER_INTERVAL) continue;

        state.lastNotified = now;
        showToast(
          `High priority: "${title}" in ${boardName}`,
          "error",
          {
            actions: [
              {
                label: "I'll Do It",
                onClick: () => {
                  const s = remindersRef.current.get(taskId);
                  if (s) s.dismissed = true;
                },
              },
              {
                label: "I Know, Wait!",
                onClick: () => {
                  const s = remindersRef.current.get(taskId);
                  if (s) s.snoozedUntil = Date.now() + SNOOZE_DURATION;
                },
              },
            ],
            duration: 15000,
          }
        );
      }

      // Clean up reminders for completed/deleted tasks
      const activeIds = new Set(highPriorityTasks.map((t) => t.taskId));
      for (const [id] of remindersRef.current) {
        if (!activeIds.has(id)) remindersRef.current.delete(id);
      }
    };

    check();
    intervalRef.current = setInterval(check, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [getHighPriorityTasks, showToast]);
}
