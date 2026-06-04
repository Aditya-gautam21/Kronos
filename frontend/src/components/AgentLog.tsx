"use client";

import { useEffect, useRef } from "react";
import { useDashboard, type LogEntry } from "@/lib/dashboard-context";

export function AgentLog() {
  const { logs } = useDashboard();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getColor = (type: string, agent: string) => {
    if (type === "error") return "text-red-400";
    if (type === "warning") return "text-claude-coral";
    if (type === "success") return "text-claude-green";

    switch (agent) {
      case "SYSTEM":
        return "text-[#7c7a72]";
      case "RESEARCH":
        return "text-claude-blue";
      case "QUANT":
        return "text-claude-coral";
      case "RISK":
        return "text-[#b0aea5]";
      case "EXECUTION":
        return "text-claude-green";
      case "PORTFOLIO":
        return "text-claude-blue/80";
      default:
        return "text-[#f9f9f6]";
    }
  };

  return (
    <div className="bg-[#222220] border border-[#333330] border-t-4 border-t-claude-coral rounded-xl flex flex-col h-full shadow-sm overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 border-b border-[#333330] bg-[#1a1a19]/80">
        <h2 className="text-[10px] font-mono tracking-widest text-[#a5a39a] font-bold">AGENT LOG STREAM</h2>
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-claude-coral/20"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-claude-coral/50"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-claude-coral animate-pulse"></div>
        </div>
      </div>

      <div className="p-4 overflow-y-auto font-mono text-[11px] leading-relaxed flex-1 custom-scrollbar bg-[#191918]/20">
        {logs.map((log: LogEntry) => (
          <div key={log.id} className="mb-1.5 hover:bg-[#222220]/50 px-1.5 py-0.5 rounded -mx-1.5 transition-colors duration-100 flex items-start">
            <span className="text-[#7c7a72] mr-3 shrink-0 select-none">[{log.timestamp}]</span>
            <span className={`${getColor("info", log.agent)} font-bold mr-3 shrink-0 w-20`}>{log.agent}</span>
            <span className={`${log.type !== "info" ? getColor(log.type, "") : "text-[#a5a39a]"}`}>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
