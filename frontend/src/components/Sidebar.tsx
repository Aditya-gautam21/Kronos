"use client";

import { LayoutDashboard, GitMerge, Inbox, Activity, Terminal, Settings, LogOut } from "lucide-react";
import clsx from "clsx";

export function Sidebar() {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: GitMerge, label: "Strategies", active: false },
    { icon: Inbox, label: "Approval Queue", active: false, badge: 2 },
    { icon: Activity, label: "Portfolio", active: false },
    { icon: Terminal, label: "Agent Logs", active: false },
  ];

  return (
    <aside className="w-64 border-r border-panel-border bg-panel flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-panel-border">
        <h1 className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-neon to-magenta-neon">
          KRONOS
        </h1>
        <p className="text-xs font-mono text-zinc-500 mt-1 uppercase tracking-widest">CIO Terminal v2.1</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={clsx(
              "w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md transition-all duration-200",
              item.active
                ? "bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/30 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4" />
              {item.label}
            </div>
            {item.badge && (
              <span className="bg-orange-neon/20 text-orange-neon text-xs px-2 py-0.5 rounded-full font-mono font-bold border border-orange-neon/30">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-panel-border space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors border border-transparent">
          <Settings className="w-4 h-4" />
          System Settings
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors border border-transparent">
          <LogOut className="w-4 h-4" />
          Disconnect
        </button>
      </div>
    </aside>
  );
}
