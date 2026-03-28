"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { uid, getDaysInMonth, getFirstDayOfMonth, isSameDay } from "@/lib/utils";
import { EVENT_COLORS } from "@/lib/types";
import type { CalendarEvent } from "@/lib/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Calendar() {
  const { state, dispatch } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(now.toISOString().slice(0, 10));
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = useMemo(() => {
    const result: { date: string; day: number; isCurrentMonth: boolean }[] = [];
    // Previous month padding
    const prevMonthDays = getDaysInMonth(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      result.push({
        date: `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, "0")}-${String(prevMonthDays - i).padStart(2, "0")}`,
        day: prevMonthDays - i,
        isCurrentMonth: false,
      });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        day: d,
        isCurrentMonth: true,
      });
    }
    // Next month padding
    const remaining = 42 - result.length;
    for (let d = 1; d <= remaining; d++) {
      result.push({
        date: `${month === 11 ? year + 1 : year}-${String(month === 11 ? 1 : month + 2).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        day: d,
        isCurrentMonth: false,
      });
    }
    return result;
  }, [year, month, daysInMonth, firstDay]);

  const eventsForDate = (date: string) =>
    state.events.filter((e) => e.date === date);

  const selectedEvents = eventsForDate(selectedDate);

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(now.toISOString().slice(0, 10));
  };

  const todayStr = now.toISOString().slice(0, 10);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Calendar</h2>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
            Today
          </button>
          <button
            onClick={() => setShowEventForm(true)}
            className="px-3 py-1.5 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            + Event
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold">{MONTH_NAMES[month]} {year}</h3>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Week headers */}
          <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="p-2 text-center text-xs font-medium text-neutral-500">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const events = eventsForDate(day.date);
              const isToday = day.date === todayStr;
              const isSelected = day.date === selectedDate;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day.date)}
                  className={`min-h-[80px] p-1.5 border-b border-r border-neutral-200 dark:border-neutral-800 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                    !day.isCurrentMonth ? "opacity-40" : ""
                  } ${isSelected ? "bg-indigo-500/5 ring-1 ring-inset ring-indigo-500/30" : ""}`}
                >
                  <div
                    className={`text-sm w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday
                        ? "bg-indigo-500 text-white font-bold"
                        : isSelected
                        ? "bg-indigo-500/10 text-indigo-500 font-medium"
                        : ""
                    }`}
                  >
                    {day.day}
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {events.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className="text-[10px] leading-tight px-1 py-0.5 rounded truncate"
                        style={{ backgroundColor: e.color + "20", color: e.color }}
                      >
                        {e.title}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-[10px] text-neutral-500 px-1">+{events.length - 3} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>

          {selectedEvents.length === 0 ? (
            <p className="text-sm text-neutral-500 mb-4">No events</p>
          ) : (
            <div className="space-y-2 mb-4">
              {selectedEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 group"
                >
                  <div className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: e.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{e.title}</div>
                    {e.time && <div className="text-xs text-neutral-500 mt-0.5">{e.time}</div>}
                    {e.description && <div className="text-xs text-neutral-400 mt-1">{e.description}</div>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingEvent(e);
                        setShowEventForm(true);
                      }}
                      className="p-1 text-neutral-400 hover:text-indigo-500"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => dispatch({ type: "DELETE_EVENT", payload: e.id })}
                      className="p-1 text-neutral-400 hover:text-red-500"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setEditingEvent(null);
              setShowEventForm(true);
            }}
            className="w-full py-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
          >
            + Add event
          </button>
        </div>
      </div>

      {showEventForm && (
        <EventForm
          event={editingEvent}
          date={selectedDate}
          onSave={(event) => {
            if (editingEvent) {
              dispatch({ type: "UPDATE_EVENT", payload: event });
            } else {
              dispatch({ type: "ADD_EVENT", payload: event });
            }
            setShowEventForm(false);
            setEditingEvent(null);
          }}
          onClose={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
}

function EventForm({
  event,
  date,
  onSave,
  onClose,
}: {
  event: CalendarEvent | null;
  date: string;
  onSave: (e: CalendarEvent) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(event?.title || "");
  const [eventDate, setEventDate] = useState(event?.date || date);
  const [time, setTime] = useState(event?.time || "");
  const [color, setColor] = useState(event?.color || EVENT_COLORS[0]);
  const [description, setDescription] = useState(event?.description || "");

  const save = () => {
    if (!title.trim()) return;
    onSave({
      id: event?.id || uid(),
      title: title.trim(),
      date: eventDate,
      time,
      color,
      description,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6 w-full max-w-md animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">{event ? "Edit Event" : "New Event"}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-indigo-500 text-sm"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 mb-1 block">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-indigo-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Color</label>
            <div className="flex gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900" : "hover:scale-110"}`}
                  style={{ backgroundColor: c, "--tw-ring-color": c } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-indigo-500 text-sm resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
            Cancel
          </button>
          <button onClick={save} className="px-4 py-2 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
