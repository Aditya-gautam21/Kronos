"use client";

import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard, type QueueItem } from "@/lib/dashboard-context";

export function ApprovalQueue() {
  const { queue } = useDashboard();

  return (
    <div className="bg-[#222220] border border-[#333330] rounded-xl p-5 flex flex-col h-full shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-serif font-bold tracking-wide text-white flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-claude-coral animate-pulse" />
          MONITORED CHECKS
        </h2>
        <span className="text-[10px] font-mono bg-claude-coral/10 text-claude-coral px-2 py-0.5 rounded border border-claude-coral/20 font-bold">
          {queue.length} ACTIVE
        </span>
      </div>

      <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1 min-h-0">
        <AnimatePresence mode="popLayout">
          {queue.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#7c7a72] font-mono italic text-xs">
              No active strategy triggers
            </div>
          ) : (
            queue.map((item: QueueItem, idx: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                className="border border-[#2c2c2a] bg-[#1a1a19] rounded-lg p-3.5 relative group hover:border-[#444440] transition-colors duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-claude-coral font-mono text-xs font-bold">
                    {item.symbol} {item.side}
                  </span>
                  {item.flags > 0 && (
                    <div className="flex items-center gap-1 text-claude-coral text-[9px] uppercase tracking-wider font-mono font-bold bg-claude-coral/10 px-1.5 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      Flags ({item.flags})
                    </div>
                  )}
                </div>

                <p className="text-xs text-[#a5a39a] mb-3 line-clamp-2 leading-relaxed">&ldquo;{item.hypothesis}&rdquo;</p>

                <div className="flex justify-between items-end border-t border-[#2c2c2a] pt-2 mt-2">
                  <div className="flex gap-4 text-[10px] font-mono">
                    <div>
                      <div className="text-[#7c7a72] mb-0.5">RISK SCORE</div>
                      <div className={item.riskScore > 80 ? "text-claude-green font-bold" : "text-claude-coral font-bold"}>
                        {item.riskScore}/100
                      </div>
                    </div>
                    <div>
                      <div className="text-[#7c7a72] mb-0.5">SHARPE</div>
                      <div className="text-white font-bold">{item.sharpe}</div>
                    </div>
                    <div>
                      <div className="text-[#7c7a72] mb-0.5">DD</div>
                      <div className="text-[#a5a39a] font-bold">{item.drawdown}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-claude-green text-[9px] uppercase tracking-wider font-mono font-bold bg-claude-green/10 px-2 py-0.5 rounded border border-claude-green/20 select-none">
                    <span className="w-1.5 h-1.5 bg-claude-green rounded-full animate-pulse" />
                    Live Order
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
