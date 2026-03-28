"use client";

import { useState, useEffect, useRef, useCallback, startTransition } from "react";
import { useApp } from "@/lib/store";
import { uid, formatTime } from "@/lib/utils";

const DEFAULT_PRESETS = {
  work: { duration: 25 * 60, label: "Focus", color: "#ef4444" },
  shortBreak: { duration: 5 * 60, label: "Short Break", color: "#22c55e" },
  longBreak: { duration: 15 * 60, label: "Long Break", color: "#6366f1" },
};

type TimerType = "work" | "shortBreak" | "longBreak";

export default function Pomodoro() {
  const { state, dispatch } = useApp();
  const [presets, setPresets] = useState(DEFAULT_PRESETS);
  const [timerType, setTimerType] = useState<TimerType>("work");
  const [timeLeft, setTimeLeft] = useState(presets.work.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [sessionsCount, setSessionsCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const preset = presets[timerType];
  const progress = 1 - timeLeft / preset.duration;

  const playSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0.15, ctx.currentTime);

      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.35;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.4, start + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 1.2);
        osc.start(start);
        osc.stop(start + 1.2);
      });

      setTimeout(() => ctx.close(), 3000);
    } catch {
      // Audio not available
    }
  }, []);

  const completeSession = useCallback(() => {
    setIsRunning(false);
    playSound();
    setSessionsCount((c) => c + 1);

    dispatch({
      type: "ADD_POMODORO_SESSION",
      payload: {
        id: uid(),
        taskId: taskTitle || "untitled",
        taskTitle: taskTitle || "Focus Session",
        duration: presets[timerType].duration,
        type: timerType,
        completedAt: new Date().toISOString(),
      },
    });

    if (timerType === "work") {
      if ((sessionsCount + 1) % 4 === 0) {
        setTimerType("longBreak");
        setTimeLeft(presets.longBreak.duration);
      } else {
        setTimerType("shortBreak");
        setTimeLeft(presets.shortBreak.duration);
      }
    } else {
      setTimerType("work");
      setTimeLeft(presets.work.duration);
    }
  }, [playSound, dispatch, taskTitle, presets, timerType, sessionsCount]);

  const onCompleteRef = useRef(completeSession);

  useEffect(() => {
    onCompleteRef.current = completeSession;
  }, [completeSession]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          onCompleteRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(preset.duration);
  };

  const switchType = (type: TimerType) => {
    setIsRunning(false);
    setTimerType(type);
    setTimeLeft(presets[type].duration);
  };

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progress);

  const [mounted, setMounted] = useState(false);
  useEffect(() => startTransition(() => setMounted(true)), []);

  const todayStr = mounted ? new Date().toISOString().slice(0, 10) : "";
  const todaySessions = mounted ? state.pomodoroSessions.filter((s) => s.completedAt.startsWith(todayStr)) : [];
  const todayWorkMinutes = todaySessions
    .filter((s) => s.type === "work")
    .reduce((sum, s) => sum + s.duration / 60, 0);

  const totalWorkMinutes = state.pomodoroSessions
    .filter((s) => s.type === "work")
    .reduce((sum, s) => sum + s.duration / 60, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold">Pomodoro Timer</h2>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Timer */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 flex flex-col items-center">
          {/* Type selector */}
          <div className="flex gap-2 mb-8">
            {(Object.keys(presets) as TimerType[]).map((type) => (
              <button
                key={type}
                onClick={() => switchType(type)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  timerType === type
                    ? "text-white"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
                style={timerType === type ? { backgroundColor: presets[type].color } : {}}
              >
                {presets[type].label} · {presets[type].duration / 60}m
              </button>
            ))}
          </div>

          {/* Custom time inputs */}
          <div className="flex gap-3 mb-6">
            {(Object.keys(presets) as TimerType[]).map((type) => (
              <div key={type} className="flex flex-col items-center gap-1">
                <label className="text-[10px] text-neutral-500">{presets[type].label}</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={presets[type].duration / 60}
                  onChange={(e) => {
                    const mins = Math.max(1, Math.min(120, Number(e.target.value) || 1));
                    setPresets((p) => ({
                      ...p,
                      [type]: { ...p[type], duration: mins * 60 },
                    }));
                    if (timerType === type && !isRunning) {
                      setTimeLeft(mins * 60);
                    }
                  }}
                  disabled={isRunning}
                  className="w-16 px-2 py-1 text-center text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>
            ))}
          </div>

          {/* Circular timer */}
          <div className="relative w-64 h-64 mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
              <circle
                cx="130"
                cy="130"
                r="120"
                fill="none"
                stroke="currentColor"
                className="text-neutral-200 dark:text-neutral-800"
                strokeWidth="6"
              />
              <circle
                cx="130"
                cy="130"
                r="120"
                fill="none"
                stroke={preset.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-mono font-bold tracking-tight">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-neutral-500 mt-2">{preset.label}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={resetTimer}
              className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            </button>
            <button
              onClick={toggleTimer}
              className="px-8 py-3 rounded-xl text-white font-medium text-lg transition-colors"
              style={{ backgroundColor: isRunning ? "#64748b" : preset.color }}
            >
              {isRunning ? "Pause" : "Start"}
            </button>
          </div>

          {/* Task input */}
          <div className="mt-8 w-full max-w-sm">
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Working on...</label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="What are you focusing on?"
              className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-indigo-500 text-sm text-center"
            />
          </div>

          {/* Session counter */}
          <div className="mt-6 text-sm text-neutral-500">
            Session {sessionsCount + 1} · {Math.floor(sessionsCount / 4)} cycles completed
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Today</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-500/10 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-red-500">{todaySessions.filter((s) => s.type === "work").length}</div>
                <div className="text-xs text-neutral-500">Sessions</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-green-500">{Math.round(todayWorkMinutes)}</div>
                <div className="text-xs text-neutral-500">Minutes</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">All Time</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Total sessions</span>
                <span className="text-sm font-medium">{state.pomodoroSessions.filter((s) => s.type === "work").length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Total focus time</span>
                <span className="text-sm font-medium">{Math.round(totalWorkMinutes)} min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">Break time</span>
                <span className="text-sm font-medium">
                  {Math.round(
                    state.pomodoroSessions
                      .filter((s) => s.type !== "work")
                      .reduce((sum, s) => sum + s.duration / 60, 0)
                  )}{" "}
                  min
                </span>
              </div>
            </div>
          </div>

          {/* Recent sessions */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Recent Sessions</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {state.pomodoroSessions
                .slice(-10)
                .reverse()
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: presets[s.type].color }}
                    />
                    <span className="flex-1 truncate">{s.taskTitle}</span>
                    <span className="text-xs text-neutral-500">{s.duration / 60}m</span>
                  </div>
                ))}
              {state.pomodoroSessions.length === 0 && (
                <p className="text-sm text-neutral-500 text-center py-4">No sessions yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
