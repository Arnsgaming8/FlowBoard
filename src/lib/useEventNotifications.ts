"use client";

import { useEffect, useRef } from "react";
import type { CalendarEvent } from "@/lib/types";

function getEventTimeMs(event: CalendarEvent): number | null {
  if (!event.time) return null;
  return new Date(`${event.date}T${event.time}:00`).getTime();
}

export function useEventNotifications(events: CalendarEvent[]) {
  const sentRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const check = () => {
      const now = Date.now();

      for (const event of events) {
        const eventTimeMs = getEventTimeMs(event);
        if (eventTimeMs === null) continue;

        const reminderMs = (event.reminderMinutes ?? 0) * 60 * 1000;
        const reminderKey = `reminder-${event.id}`;
        const eventKey = `event-${event.id}`;

        // Send the pre-event reminder (e.g. 5 min before)
        if (reminderMs > 0) {
          const reminderTime = eventTimeMs - reminderMs;
          if (now >= reminderTime && now < reminderTime + 60000 && !sentRef.current.has(reminderKey)) {
            sentRef.current.add(reminderKey);
            new Notification(`Upcoming: ${event.title}`, {
              body: `Starts in ${event.reminderMinutes} minutes${event.time ? ` at ${event.time}` : ""}`,
              tag: reminderKey,
            });
          }
        }

        // Send notification at event time
        if (now >= eventTimeMs && now < eventTimeMs + 60000 && !sentRef.current.has(eventKey)) {
          sentRef.current.add(eventKey);
          new Notification(`Now: ${event.title}`, {
            body: event.description || `Event starts now${event.time ? ` at ${event.time}` : ""}`,
            tag: eventKey,
          });
        }
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [events]);
}
