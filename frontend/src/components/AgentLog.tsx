"use client";

import { useEffect, useRef } from "react";
import { useDashboard, type LogEntry } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

const agentColor = (agent: string) => {
  switch (agent) {
    case "SYSTEM": return "text-text-tertiary";
    case "Quant": return "text-accent-purple";
    case "Trader": return "text-accent-cyan";
    case "Researcher": return "text-accent-blue";
    default: return "text-text-secondary";
  }
};

const typeColor = (type: string) => {
  if (type === "error") return "text-accent-red";
  if (type === "success") return "text-accent-green";
  if (type === "warning") return "text-accent-amber";
  return "text-text-secondary";
};

export function AgentLog() {
  const { logs } = useDashboard();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="card flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle">
        <h2 className="text-xs font-semibold uppercase tracking-wider">Agent Log</h2>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-green/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent-green/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 font-mono text-[10px] leading-relaxed">
        {logs.map((log: LogEntry) => (
          <div key={log.id} className="flex gap-3 py-0.5 hover:bg-bg-card-hover px-1 rounded transition-colors">
            <span className="text-text-tertiary shrink-0">[{log.timestamp}]</span>
            <span className={cn("font-semibold shrink-0 w-16", agentColor(log.agent))}>{log.agent}</span>
            <span className={typeColor(log.type)}>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
