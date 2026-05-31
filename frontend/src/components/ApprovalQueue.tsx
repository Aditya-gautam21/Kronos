"use client";

import { Check, X, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { fetchTradeHistory } from "@/lib/api";

type QueueItem = {
  id: string;
  symbol: string;
  side: string;
  size: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  confidence: string;
  hypothesis: string;
  riskScore: number;
  sharpe: string;
  drawdown: string;
  flags: number;
};

export function ApprovalQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const refreshQueue = useCallback(async () => {
    try {
      const history = await fetchTradeHistory();
      if (Array.isArray(history)) {
        const items: QueueItem[] = history
          .filter((t: any) => t.status === "active")
          .map((t: any) => ({
            id: t.id,
            symbol: t.symbol,
            side: t.side,
            size: t.size,
            entry_price: t.entry_price,
            stop_loss: t.stop_loss,
            take_profit: t.take_profit,
            confidence: t.confidence || "medium",
            hypothesis: t.hypothesis || "Trade placed by autonomous bot",
            riskScore: t.confidence === "high" ? 85 : t.confidence === "medium" ? 65 : 45,
            sharpe: "1.8",
            drawdown: "-2.1%",
            flags: t.confidence === "low" ? 1 : 0,
          }));
        setQueue(items);
      }
    } catch {
      // backend unreachable
    }
  }, []);

  useEffect(() => {
    refreshQueue();
    const interval = setInterval(refreshQueue, 5000);
    return () => clearInterval(interval);
  }, [refreshQueue]);

  return (
    <div className="glass-panel rounded-lg p-5 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-bold tracking-wider text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-neon animate-pulse" />
          APPROVAL QUEUE
        </h2>
        <span className="text-xs font-mono bg-orange-neon/10 text-orange-neon px-2 py-1 rounded border border-orange-neon/20">
          {queue.length} PENDING
        </span>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar h-full">
        {queue.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 font-mono italic">Queue is empty</div>
        ) : (
          queue.map((item, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={item.id}
              className="border border-panel-border bg-black/40 rounded-md p-4 relative group hover:border-cyan-neon/30 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-cyan-neon font-mono text-xs">
                  {item.symbol} {item.side}
                </span>
                {item.flags > 0 && (
                  <div className="flex items-center gap-1 text-orange-neon text-[10px] uppercase tracking-wider font-mono bg-orange-neon/10 px-1.5 py-0.5 rounded">
                    <AlertTriangle className="w-3 h-3" />
                    Flags ({item.flags})
                  </div>
                )}
              </div>

              <p className="text-sm text-zinc-300 mb-4 line-clamp-2">&ldquo;{item.hypothesis}&rdquo;</p>

              <div className="flex justify-between items-end">
                <div className="flex gap-4 text-xs font-mono">
                  <div>
                    <div className="text-zinc-500 mb-1">RISK SCORE</div>
                    <div className={item.riskScore > 80 ? "text-green-neon" : "text-orange-neon"}>{item.riskScore}/100</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">SHARPE</div>
                    <div className="text-white">{item.sharpe}</div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">DD</div>
                    <div className="text-zinc-300">{item.drawdown}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="w-8 h-8 flex items-center justify-center rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded bg-green-neon/10 text-green-neon hover:bg-green-neon hover:text-black border border-green-neon/20 transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
