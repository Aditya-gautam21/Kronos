"use client";

import { useState } from "react";
import { Play, Power, Square, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { StrategyPipeline } from "./StrategyPipeline";
import { AgentLog } from "./AgentLog";
import { startScheduler, stopScheduler, runManualPipeline } from "@/lib/api";
import { useDashboard, useRefresh } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

export function AgentOperations() {
  const { totalExecutions, isRunning } = useDashboard();
  const refresh = useRefresh();

  const [manualLoading, setManualLoading] = useState(false);
  const [schedulerLoading, setSchedulerLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" | "info" | null }>({ message: "", type: null });

  const runManual = async () => {
    setManualLoading(true);
    setStatus({ message: "Running pipeline cycle...", type: "info" });
    try {
      const res = await runManualPipeline();
      if (res.status === "error") setStatus({ message: res.reason, type: "error" });
      else setStatus({ message: "Pipeline cycle completed.", type: "success" });
      await refresh();
    } catch (e: any) {
      setStatus({ message: e.message || "Connection failed", type: "error" });
    } finally {
      setManualLoading(false);
    }
  };

  const startBot = async () => {
    setSchedulerLoading(true);
    setStatus({ message: "Starting scheduler...", type: "info" });
    try {
      const res = await startScheduler();
      if (res.status === "error") setStatus({ message: res.reason, type: "error" });
      else setStatus({ message: "Scheduler started — autonomous trading every 15 min.", type: "success" });
      await refresh();
    } catch (e: any) {
      setStatus({ message: e.message || "Connection failed", type: "error" });
    } finally {
      setSchedulerLoading(false);
    }
  };

  const stopBot = async () => {
    setSchedulerLoading(true);
    setStatus({ message: "Stopping scheduler...", type: "info" });
    try {
      const res = await stopScheduler();
      if (res.status === "error") setStatus({ message: res.reason, type: "error" });
      else setStatus({ message: "Scheduler stopped.", type: "success" });
      await refresh();
    } catch (e: any) {
      setStatus({ message: e.message || "Connection failed", type: "error" });
    } finally {
      setSchedulerLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
      {/* Controls */}
      <div className="card p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">Agent Controls</h2>
            <p className="text-xs text-text-secondary mt-1">
              Scheduler: {isRunning ? <span className="text-accent-green font-medium">Running</span> : <span className="text-text-tertiary">Stopped</span>}
              {" · "}Cycles completed: {totalExecutions}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={runManual}
              disabled={manualLoading || schedulerLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-bg-elevated text-text-primary border border-border-default hover:bg-bg-card-hover disabled:opacity-50 transition-colors"
            >
              {manualLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-accent-cyan" />}
              Run Manual Cycle
            </button>

            <button
              onClick={startBot}
              disabled={manualLoading || schedulerLoading || isRunning}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-accent-blue text-white hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {schedulerLoading && isRunning === false ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
              {isRunning ? "Scheduler Running" : "Start Scheduler"}
            </button>

            {isRunning && (
              <button
                onClick={stopBot}
                disabled={manualLoading || schedulerLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-accent-red text-white hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {schedulerLoading && isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                Stop Scheduler
              </button>
            )}
          </div>
        </div>

        {status.message && (
          <div className={cn(
            "mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg border",
            status.type === "error" ? "bg-accent-red/5 border-accent-red/20 text-accent-red" :
            status.type === "success" ? "bg-accent-green/5 border-accent-green/20 text-accent-green" :
            "bg-accent-blue/5 border-accent-blue/20 text-accent-blue"
          )}>
            {status.type === "error" ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> :
             status.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> :
             <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
            {status.message}
          </div>
        )}
      </div>

      {/* Pipeline */}
      <div className="h-[300px]">
        <StrategyPipeline />
      </div>

      {/* Logs */}
      <div className="h-[280px]">
        <AgentLog />
      </div>
    </div>
  );
}
