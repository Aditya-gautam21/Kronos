"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Target } from "lucide-react";
import { useDashboard, type Position } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

export function ApprovalQueue() {
  const { positions } = useDashboard();

  return (
    <div className="card p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">Live Positions</h2>
        <span className="text-[10px] font-mono text-accent-green bg-accent-green/10 px-1.5 py-0.5 rounded">{positions.length} active</span>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {positions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-text-tertiary text-xs">No open positions</div>
          ) : (
            positions.map((p: Position, i: number) => (
              <motion.div
                key={p.symbol}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                className="bg-bg-primary border border-border-subtle rounded-lg p-3 hover:border-border-default transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("font-mono text-xs font-semibold", p.side === "LONG" ? "text-accent-green" : "text-accent-red")}>
                    {p.symbol} {p.side}
                  </span>
                  <span className="text-[9px] text-text-tertiary font-mono flex items-center gap-1">
                    <Target className="w-2.5 h-2.5" />{p.leverage}x
                  </span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <div>
                    <span className="text-text-tertiary">Entry </span>
                    <span className="text-text-primary font-medium">${p.entry_price.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Mark </span>
                    <span className="text-text-primary font-medium">${p.mark_price.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary">PnL </span>
                    <span className={cn("font-medium", (p.pnl ?? 0) >= 0 ? "text-accent-green" : "text-accent-red")}>
                      {(p.pnl ?? 0) >= 0 ? "+" : ""}{p.pnl?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
