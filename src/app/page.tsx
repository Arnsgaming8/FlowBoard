"use client";

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
import { useHighPriorityReminders } from "@/lib/useHighPriorityReminders";
import type { View } from "@/lib/types";

function AppContent() {
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
      <Sidebar />
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
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}
