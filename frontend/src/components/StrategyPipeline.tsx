"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

export function StrategyPipeline() {
  const { pipeline } = useDashboard();

  return (
    <div className="card p-5 flex flex-col h-full">
      <h2 className="text-sm font-semibold mb-4">Pipeline</h2>

      <div className="grid grid-cols-3 gap-3 h-full min-h-0">
        {pipeline.map((col) => (
          <div key={col.title} className={cn("border-t-2 rounded-lg p-3 flex flex-col h-full min-h-0", col.color, col.bg)}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-[10px] font-semibold uppercase tracking-wider", col.text)}>{col.title}</span>
              <span className={cn("text-[9px] font-mono font-medium px-1.5 py-0.5 rounded", col.bg, col.text)}>
                {col.items.length}
              </span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
              <AnimatePresence mode="popLayout">
                {col.items.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-text-tertiary text-[10px] italic">
                    Awaiting run
                  </div>
                ) : (
                  col.items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      transition={{ delay: Math.min(i * 0.04, 0.2) }}
                      className="bg-bg-primary/60 border border-border-subtle rounded-lg p-2"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-text-tertiary font-mono">{item.time}</span>
                      </div>
                      <p className="text-[10px] text-text-secondary leading-relaxed truncate">{item.desc}</p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
