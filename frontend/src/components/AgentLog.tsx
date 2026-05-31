"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { fetchLogs } from "@/lib/api";

type LogEntry = {
  id: number;
  agent: string;
  message: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
};

export function AgentLog() {
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 1, agent: "SYSTEM", message: "System standing by. Waiting for CIO to initiate autonomous trading.", timestamp: "00:00:00.000", type: "info" },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshLogs = useCallback(async () => {
    try {
      const data = await fetchLogs();
      if (Array.isArray(data) && data.length > 0) {
        setLogs(data);
      }
    } catch {
      // backend unreachable — keep current logs
    }
  }, []);

  useEffect(() => {
    refreshLogs();
    const interval = setInterval(refreshLogs, 3000);
    return () => clearInterval(interval);
  }, [refreshLogs]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getColor = (type: string, agent: string) => {
    if (type === "error") return "text-red-500";
    if (type === "warning") return "text-orange-neon";
    if (type === "success") return "text-green-neon";

    switch (agent) {
      case "SYSTEM":
        return "text-zinc-500";
      case "RESEARCH":
        return "text-cyan-neon";
      case "QUANT":
        return "text-magenta-neon";
      case "RISK":
        return "text-orange-neon";
      case "EXECUTION":
        return "text-green-neon";
      case "PORTFOLIO":
        return "text-blue-400";
      default:
        return "text-white";
    }
  };

  return (
    <div className="glass-panel rounded-lg flex flex-col h-full bg-[#050505]/90 border-t-4 border-t-cyan-neon overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 border-b border-panel-border bg-black/50">
        <h2 className="text-[10px] font-mono tracking-widest text-zinc-400">AGENT LOG STREAM</h2>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-neon/30"></div>
          <div className="w-2 h-2 rounded-full bg-cyan-neon/60"></div>
          <div className="w-2 h-2 rounded-full bg-cyan-neon animate-pulse"></div>
        </div>
      </div>

      <div className="p-4 overflow-y-auto font-mono text-[11px] leading-relaxed flex-1 custom-scrollbar">
        {logs.map((log) => (
          <div key={log.id} className="mb-2 hover:bg-white/5 px-1 py-0.5 rounded -mx-1 transition-colors flex">
            <span className="text-zinc-600 mr-3 shrink-0">[{log.timestamp}]</span>
            <span className={`${getColor("info", log.agent)} font-bold mr-3 shrink-0 w-20`}>{log.agent}</span>
            <span className={`${log.type !== "info" ? getColor(log.type, "") : "text-zinc-300"}`}>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
