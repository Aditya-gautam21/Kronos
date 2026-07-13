"use client";

import { useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

export function TradeHistoryTable() {
  const { trades } = useDashboard();
  const completed = trades.filter(t => t.status !== "active");

  return (
    <div className="card p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Trade History</h2>
        <span className="text-[10px] text-text-tertiary font-mono">{completed.length} trades</span>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border-subtle text-text-tertiary text-[10px] uppercase tracking-wider">
              <th className="pb-2.5 font-medium">Time</th>
              <th className="pb-2.5 font-medium">Symbol</th>
              <th className="pb-2.5 font-medium text-center">Side</th>
              <th className="pb-2.5 font-medium text-right">Entry</th>
              <th className="pb-2.5 font-medium text-right">PnL</th>
              <th className="pb-2.5 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {completed.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-text-tertiary text-sm">
                  No completed trades yet. Trades appear here after positions close.
                </td>
              </tr>
            ) : (
              completed.map((t, i) => {
                const pnlVal = t.pnl ?? 0;
                return (
                  <tr key={t.id || i} className="border-b border-border-subtle/50 hover:bg-bg-card-hover transition-colors">
                    <td className="py-3 text-text-tertiary font-mono">{t.timestamp}</td>
                    <td className="py-3 font-mono font-medium">{t.symbol}</td>
                    <td className="py-3 text-center">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium",
                        t.side === "LONG" ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"
                      )}>{t.side}</span>
                    </td>
                    <td className="py-3 text-right font-mono text-text-secondary">${t.entry_price.toFixed(2)}</td>
                    <td className={cn("py-3 text-right font-mono font-medium", pnlVal > 0 ? "text-accent-green" : pnlVal < 0 ? "text-accent-red" : "text-text-secondary")}>
                      {pnlVal > 0 ? "+" : ""}{pnlVal.toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">{t.status || "CLOSED"}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
