"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Activity, Target, BarChart3, Clock } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

export function DashboardHome() {
  const { totalPnl, winRate, activeStrategies, drawdown, totalExecutions, totalBalance, totalUnrealizedPnl, positions, pipeline, logs, botStatus, lastUpdated } = useDashboard();

  const recentLogs = useMemo(() => logs.slice(-6), [logs]);
  const accountNetPnl = totalPnl + totalUnrealizedPnl;
  const pnlPositive = accountNetPnl >= 0;

  const stats = [
    { label: "Portfolio Value", value: `$${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: BarChart3, trend: null },
    { label: "Net P&L (Total)", value: `${pnlPositive ? "+" : ""}$${accountNetPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: pnlPositive ? TrendingUp : TrendingDown, trend: pnlPositive ? "up" : "down" as const },
    { label: "Win Rate", value: `${winRate.toFixed(1)}%`, icon: Target, trend: winRate >= 50 ? "up" as const : "down" as const },
    { label: "Active Positions", value: String(activeStrategies), icon: Activity, trend: null },
  ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {botStatus.is_running ? "Autonomous pipeline active" : "Scheduler idle — start it in Operations"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "--"}</span>
          <span className="text-text-secondary ml-1">every 10s</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 flex flex-col gap-2 card-hover transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-tertiary font-medium tracking-wide uppercase">{s.label}</span>
              <s.icon className={cn(
                "w-4 h-4",
                s.trend === "up" ? "text-accent-green" : s.trend === "down" ? "text-accent-red" : "text-text-tertiary"
              )} />
            </div>
            <span className={cn(
              "text-2xl font-semibold font-mono tracking-tight",
              s.trend === "up" ? "text-accent-green" : s.trend === "down" ? "text-accent-red" : "text-text-primary"
            )}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Positions + Pipeline row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active positions */}
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Active Positions</h2>
            <span className="text-xs text-text-tertiary">Binance Testnet</span>
          </div>

          {positions && positions.length === 0 ? (
            <div className="py-12 text-center text-text-tertiary text-sm">
              No open positions. The bot will place trades when the pipeline detects an edge.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-text-tertiary">
                  <th className="pb-2 font-medium">Symbol</th>
                  <th className="pb-2 font-medium">Side</th>
                  <th className="pb-2 font-medium text-right">Size</th>
                  <th className="pb-2 font-medium text-right">Entry</th>
                  <th className="pb-2 font-medium text-right">Mark</th>
                  <th className="pb-2 font-medium text-right">PnL</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  const pnlNum = p.pnl ?? 0;
                  return (
                    <tr key={p.symbol} className="border-b border-border-subtle/50 hover:bg-bg-card-hover transition-colors">
                      <td className="py-2.5 font-mono font-medium">{p.symbol}</td>
                      <td className="py-2.5">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium",
                          p.side === "LONG" ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"
                        )}>
                          {p.side}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono">{p.size}</td>
                      <td className="py-2.5 text-right font-mono text-text-secondary">${p.entry_price.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-mono">${p.mark_price.toFixed(2)}</td>
                      <td className={cn("py-2.5 text-right font-mono font-medium", pnlNum >= 0 ? "text-accent-green" : "text-accent-red")}>
                        {pnlNum >= 0 ? "+" : ""}{pnlNum.toFixed(2)}
                        <span className="text-text-tertiary ml-1 text-[10px]">({p.pnl_pct})</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pipeline preview */}
        <div className="card p-4 flex flex-col">
          <h2 className="text-sm font-semibold mb-4">Pipeline</h2>
          <div className="space-y-4 flex-1">
            {pipeline.map((col) => (
              <div key={col.title} className="flex items-start gap-3">
                <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", col.bg)} />
                <div className="flex-1 min-w-0">
                  <span className={cn("text-[10px] uppercase tracking-wider font-medium", col.text)}>{col.title}</span>
                  {col.items.length === 0 ? (
                    <p className="text-xs text-text-tertiary italic mt-0.5">Waiting for pipeline run</p>
                  ) : (
                    <p className="text-xs text-text-secondary mt-0.5 truncate">{col.items[col.items.length - 1].desc}</p>
                  )}
                </div>
                <span className="text-[10px] text-text-tertiary font-mono">{col.items.length}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent logs */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold mb-3">Recent Logs</h2>
        <div className="space-y-1 font-mono text-[11px]">
          {recentLogs.map((log) => (
            <div key={log.id} className="flex gap-3 py-0.5 hover:bg-bg-card-hover px-1.5 rounded transition-colors">
              <span className="text-text-tertiary shrink-0">[{log.timestamp}]</span>
              <span className={cn(
                "font-medium shrink-0 w-20",
                log.type === "error" ? "text-accent-red" : "text-text-secondary"
              )}>{log.agent}</span>
              <span className="text-text-tertiary truncate">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
