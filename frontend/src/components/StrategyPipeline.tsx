"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useDashboard, type PipelineColumn } from "@/lib/dashboard-context";

export function StrategyPipeline() {
  const { pipeline: columns } = useDashboard();

  return (
    <div className="bg-[#222220] border border-[#333330] rounded-xl p-5 flex flex-col h-full shadow-sm">
      <h2 className="text-sm font-serif font-bold tracking-wide text-white mb-4">STRATEGY PIPELINE</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full min-h-0">
        {columns.map((col: PipelineColumn, i: number) => (
          <div key={i} className={`border-t-2 ${col.color} bg-[#1a1a19]/40 border-x border-b border-[#2c2c2a] rounded-b-lg p-3 flex flex-col h-full min-h-0`}>
            <div className="flex justify-between items-center mb-3">
              <span className={`text-[10px] font-bold tracking-wider ${col.text}`}>{col.title}</span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${col.bg} ${col.text} font-bold`}>
                {col.items.length}
              </span>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
              <AnimatePresence mode="popLayout">
                {col.items.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[#7c7a72] font-mono italic text-[10px]">No active runs</div>
                ) : (
                  col.items.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                      className="bg-[#191918] border border-[#2c2c2a] rounded p-2.5 text-xs hover:border-[#444440] transition-colors duration-200 cursor-default shadow-sm"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-mono font-bold text-white">{item.id}</span>
                        <span className="text-[9px] text-[#7c7a72]">{item.time}</span>
                      </div>
                      <p className="text-[#a5a39a] leading-relaxed truncate">{item.desc}</p>
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
