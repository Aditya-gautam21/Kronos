"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { fetchPipeline } from "@/lib/api";

type PipelineItem = {
  id: string;
  time: string;
  desc: string;
};

export function StrategyPipeline() {
  const [columns, setColumns] = useState([
    { title: "RESEARCH", color: "border-cyan-neon", bg: "bg-cyan-neon/10", text: "text-cyan-neon", items: [] as PipelineItem[] },
    { title: "BACKTEST", color: "border-magenta-neon", bg: "bg-magenta-neon/10", text: "text-magenta-neon", items: [] as PipelineItem[] },
    { title: "RISK REVIEW", color: "border-orange-neon", bg: "bg-orange-neon/10", text: "text-orange-neon", items: [] as PipelineItem[] },
  ]);

  const refreshPipeline = useCallback(async () => {
    try {
      const data = await fetchPipeline();
      if (data) {
        setColumns([
          { title: "RESEARCH", color: "border-cyan-neon", bg: "bg-cyan-neon/10", text: "text-cyan-neon", items: data.research || [] },
          { title: "BACKTEST", color: "border-magenta-neon", bg: "bg-magenta-neon/10", text: "text-magenta-neon", items: data.backtest || [] },
          { title: "RISK REVIEW", color: "border-orange-neon", bg: "bg-orange-neon/10", text: "text-orange-neon", items: data.risk_review || [] },
        ]);
      }
    } catch {
      // backend unreachable
    }
  }, []);

  useEffect(() => {
    refreshPipeline();
    const interval = setInterval(refreshPipeline, 5000);
    return () => clearInterval(interval);
  }, [refreshPipeline]);

  return (
    <div className="glass-panel rounded-lg p-5 flex flex-col h-full">
      <h2 className="text-sm font-bold tracking-wider text-white mb-6">STRATEGY PIPELINE</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {columns.map((col, i) => (
          <div key={i} className={`border-t-2 ${col.color} bg-black/40 rounded-b-md p-3 flex flex-col h-full`}>
            <div className="flex justify-between items-center mb-4">
              <span className={`text-[10px] font-bold tracking-widest ${col.text}`}>{col.title}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${col.bg} ${col.text}`}>{col.items.length}</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {col.items.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-600 font-mono italic text-[10px]">No strategies</div>
              ) : (
                col.items.map((item, idx) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    key={item.id}
                    className="bg-[#111] border border-panel-border rounded p-3 text-xs hover:border-zinc-600 transition-colors cursor-default"
                  >
                    <div className="flex justify-between mb-1">
                      <span className={`font-mono font-bold ${col.text}`}>{item.id}</span>
                      <span className="text-[9px] text-zinc-500">{item.time}</span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed truncate">{item.desc}</p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
