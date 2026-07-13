"use client";

import { LayoutDashboard, BarChart3, ListOrdered, Activity, Bot } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "positions", label: "Positions", icon: BarChart3 },
  { id: "history", label: "History", icon: ListOrdered },
  { id: "operations", label: "Operations", icon: Activity },
];

export function Sidebar() {
  const { activeView, setActiveView, isRunning } = useDashboard();

  return (
    <aside className="w-56 h-screen flex flex-col border-r border-border-subtle bg-bg-card shrink-0">
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border-subtle">
        <div className="w-7 h-7 rounded-lg bg-accent-blue flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sm tracking-tight">Kronos</span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              activeView === item.id
                ? "bg-bg-elevated text-text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-card-hover"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-border-subtle">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-text-secondary">
          <div className={cn("w-2 h-2 rounded-full shrink-0", isRunning ? "bg-accent-green" : "bg-text-tertiary")} />
          <span>{isRunning ? "Scheduler running" : "Scheduler idle"}</span>
        </div>
      </div>
    </aside>
  );
}
