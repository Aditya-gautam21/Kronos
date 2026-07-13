"use client";

import { useDashboard, type Position } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

export function LiveTrades() {
  const { positions } = useDashboard();

  return (
    <div className="card p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Active Positions</h2>
        <span className="text-[10px] text-text-tertiary font-mono">Binance Futures Testnet</span>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border-subtle text-text-tertiary text-[10px] uppercase tracking-wider">
              <th className="pb-2.5 font-medium">Symbol</th>
              <th className="pb-2.5 font-medium text-center">Side</th>
              <th className="pb-2.5 font-medium text-right">Size</th>
              <th className="pb-2.5 font-medium text-right">Entry</th>
              <th className="pb-2.5 font-medium text-right">Mark</th>
              <th className="pb-2.5 font-medium text-right">PnL</th>
              <th className="pb-2.5 font-medium text-right">Lev</th>
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-text-tertiary text-sm">
                  No active positions. The bot will place trades when the pipeline runs.
                </td>
              </tr>
            ) : (
              positions.map((p: Position) => {
                const pnlVal = p.pnl ?? 0;
                const isLong = p.side === "LONG";
                return (
                  <tr key={p.symbol} className="border-b border-border-subtle/50 hover:bg-bg-card-hover transition-colors">
                    <td className="py-3 font-mono font-medium">{p.symbol}</td>
                    <td className="py-3 text-center">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium",
                        isLong ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"
                      )}>{p.side}</span>
                    </td>
                    <td className="py-3 text-right font-mono">{p.size}</td>
                    <td className="py-3 text-right font-mono text-text-secondary">${p.entry_price.toFixed(2)}</td>
                    <td className="py-3 text-right font-mono">${p.mark_price.toFixed(2)}</td>
                    <td className={cn("py-3 text-right font-mono font-medium", pnlVal >= 0 ? "text-accent-green" : "text-accent-red")}>
                      {pnlVal >= 0 ? "+" : ""}{pnlVal.toFixed(2)}
                      <span className="text-text-tertiary ml-1 text-[10px]">({p.pnl_pct})</span>
                    </td>
                    <td className="py-3 text-right font-mono">{p.leverage}x</td>
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
