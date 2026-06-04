"use client";

import { TrendingUp, Activity, Crosshair, DollarSign, Power, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { startBot } from "@/lib/api";
import { useDashboard, useRefresh } from "@/lib/dashboard-context";

export function MetricsRibbon() {
  const { totalPnl, winRate, activeStrategies, drawdown, totalExecutions } = useDashboard();
  const refresh = useRefresh();

  const [isLoading, setIsLoading] = useState(false);
  const [botStatus, setBotStatus] = useState<{ message: string; type: "success" | "error" | null }>({
    message: "",
    type: null,
  });

  const pnlColor = totalPnl >= 0 ? "text-claude-green" : "text-red-400";
  const pnlSign = totalPnl >= 0 ? "+" : "";

  const handleTriggerBot = async () => {
    setIsLoading(true);
    setBotStatus({ message: "Executing autonomous pipeline...", type: null });
    try {
      const res = await startBot();
      if (res.status === "error") {
        setBotStatus({ message: `Error: ${res.reason}`, type: "error" });
      } else if (res.status === "skipped") {
        setBotStatus({ message: `Skipped: ${res.reason}`, type: "success" });
      } else {
        setBotStatus({ message: "Trade executed successfully", type: "success" });
      }
      await refresh();
    } catch (e: any) {
      setBotStatus({ message: `Failed to connect: ${e.message || e}`, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#222220] border border-[#333330] rounded-xl p-5 gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-serif font-bold text-claude-coral tracking-wide">AUTONOMOUS AGENT PIPELINE</h2>
          <p className="text-xs text-[#a5a39a] font-mono mt-0.5">
            System status: standby. {totalExecutions > 0 ? `${totalExecutions} trade cycles completed.` : "Agents ready for telemetry input."}
          </p>

          {botStatus.message && (
            <div
              className={`mt-3 flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-md border ${
                botStatus.type === "error"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : botStatus.type === "success"
                  ? "bg-claude-green/10 text-claude-green border-claude-green/20"
                  : "bg-claude-blue/10 text-claude-blue border-claude-blue/20"
              }`}
            >
              {botStatus.type === "error" ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : botStatus.type === "success" ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              )}
              {botStatus.message}
            </div>
          )}
        </div>
        <button
          onClick={handleTriggerBot}
          disabled={isLoading}
          className="flex items-center justify-center min-w-[240px] gap-2 px-6 py-3 rounded-md font-mono font-bold tracking-widest text-xs uppercase cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-claude-coral hover:bg-opacity-95 text-white shadow-sm border border-[#e0573e]/10"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>RUNNING...</span>
            </>
          ) : (
            <>
              <Power className="w-4 h-4" />
              <span>RUN AGENT PIPELINE</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "TOTAL PNL (LIVE)",
            value: `${pnlSign}$${totalPnl.toFixed(2)}`,
            subValue: "Real-time from Binance",
            icon: DollarSign,
            color: pnlColor,
          },
          {
            label: "ACTIVE STRATEGIES",
            value: `${activeStrategies} / 12`,
            subValue: "Open positions",
            icon: Activity,
            color: activeStrategies > 0 ? "text-claude-blue" : "text-[#a5a39a]",
          },
          {
            label: "GLOBAL DRAWDOWN",
            value: `${drawdown.toFixed(1)}%`,
            subValue: "Max limit: -5.0%",
            icon: TrendingUp,
            color: drawdown < -2 ? "text-claude-coral" : "text-[#a5a39a]",
          },
          {
            label: "WIN RATE",
            value: `${winRate.toFixed(1)}%`,
            subValue: "Trailing 30D",
            icon: Crosshair,
            color: winRate >= 50 ? "text-claude-green" : "text-[#a5a39a]",
          },
        ].map((metric, i) => (
          <div key={i} className="bg-[#222220] border border-[#333330] rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#444440] transition-colors duration-200">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-mono font-bold text-[#a5a39a] tracking-wider">{metric.label}</span>
              <metric.icon className={`w-4 h-4 ${metric.color}`} />
            </div>

            <div>
              <div className={`text-2xl font-serif font-bold tracking-tight text-white`}>
                <span className={metric.color !== "text-[#a5a39a]" ? metric.color : "text-white"}>{metric.value}</span>
              </div>
              <div className="text-[10px] mt-1 font-mono text-[#7c7a72]">{metric.subValue}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
