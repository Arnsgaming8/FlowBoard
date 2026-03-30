"use client";

import { useState, useEffect, startTransition } from "react";
import { AppProvider, useApp } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";
import { ToastProvider } from "@/components/Toast";
import Dashboard from "@/components/Dashboard";
import Kanban from "@/components/Kanban";
import Notes from "@/components/Notes";
import Calendar from "@/components/Calendar";
import Pomodoro from "@/components/Pomodoro";
import Analytics from "@/components/Analytics";
import AuthPage from "@/components/AuthPage";
import { useHighPriorityReminders } from "@/lib/useHighPriorityReminders";
import type { View } from "@/lib/types";

function AppContent({ onLogout }: { onLogout: () => void }) {
  const { state } = useApp();

  useHighPriorityReminders(state.boards);

  const views: Record<View, React.ReactNode> = {
    dashboard: <Dashboard />,
    kanban: <Kanban />,
    notes: <Notes />,
    calendar: <Calendar />,
    pomodoro: <Pomodoro />,
    analytics: <Analytics />,
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar onLogout={onLogout} />
      <main
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: state.sidebarOpen ? "260px" : "0" }}
      >
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {views[state.currentView]}
        </div>
      </main>
      <CommandPalette />
    </div>
  );
}

export default function Home() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<{ id: number; email: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => {
      const token = localStorage.getItem("flowboard-token");
      const user = localStorage.getItem("flowboard-user");
      if (token && user) {
        setAuthToken(token);
        setAuthUser(JSON.parse(user));
      }
      setMounted(true);
    });
  }, []);

  const handleAuth = (token: string, user: { id: number; email: string }) => {
    localStorage.setItem("flowboard-token", token);
    localStorage.setItem("flowboard-user", JSON.stringify(user));
    setAuthToken(token);
    setAuthUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("flowboard-token");
    localStorage.removeItem("flowboard-user");
    setAuthToken(null);
    setAuthUser(null);
  };

  if (!mounted) return null;

  if (!authToken) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <AppProvider>
      <ToastProvider>
        <AppContent onLogout={handleLogout} />
      </ToastProvider>
    </AppProvider>
  );
}
