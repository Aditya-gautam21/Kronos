"use client";

import { LayoutDashboard, GitMerge, Inbox, Activity, Terminal } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";
import { useDashboard } from "@/lib/dashboard-context";

export function Sidebar() {
  const { queue } = useDashboard();
  const [activeItem, setActiveItem] = useState("Dashboard");

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
    { icon: GitMerge, label: "Strategies", id: "strategy-pipeline" },
    { icon: Inbox, label: "Approval Queue", id: "approval-queue", showBadge: true },
    { icon: Activity, label: "Portfolio", id: "kelly-allocation" },
    { icon: Terminal, label: "Agent Logs", id: "agent-logs" },
  ];

  const handleScroll = (id: string, label: string) => {
    setActiveItem(label);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const pendingCount = queue.length;

  return (
    <aside className="w-64 border-r border-[#2c2c2a] bg-[#141413] flex flex-col h-full shrink-0 select-none">
      <div className="p-6 border-b border-[#2c2c2a] bg-[#191918]/30">
        <h1 className="text-2xl font-serif font-bold tracking-wide text-claude-coral">
          KRONOS
        </h1>
        <p className="text-[10px] font-mono text-[#a5a39a] mt-1 uppercase tracking-widest">CIO Intelligent Terminal</p>
      </div>

      <nav className="flex-1 p-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = activeItem === item.label;
          return (
            <button
              key={item.label}
              onClick={() => handleScroll(item.id, item.label)}
              className={clsx(
                "w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-claude-coral/8 text-claude-coral border border-claude-coral/20 shadow-sm"
                  : "text-[#a5a39a] hover:text-foreground hover:bg-[#222220]/50 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.showBadge && pendingCount > 0 && (
                <span className="bg-claude-coral/15 text-claude-coral text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border border-claude-coral/20">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#2c2c2a] bg-[#191918]/40 text-xs font-mono space-y-2">
        <div className="flex items-center justify-between text-[#a5a39a]">
          <span>TELEMETRY</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-claude-green animate-pulse" />
            <span className="text-[10px] text-claude-green font-bold tracking-wider">CONNECTED</span>
          </div>
        </div>
        <div className="flex justify-between text-[#7c7a72] text-[10px]">
          <span>BINANCE TESTNET</span>
          <span>v2.1</span>
        </div>
      </div>
    </aside>
  );
}
