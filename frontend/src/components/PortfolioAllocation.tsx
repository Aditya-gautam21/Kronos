"use client";

import { memo, useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { useDashboard, type AllocationItem } from "@/lib/dashboard-context";

const MemoizedPieChart = memo(function MemoizedPieChart({ data }: { data: AllocationItem[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={75}
          paddingAngle={4}
          dataKey="value"
          stroke="none"
          isAnimationActive={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a19",
            borderColor: "#333330",
            color: "white",
            borderRadius: "6px",
            fontSize: "11px",
            fontFamily: "monospace",
          }}
          itemStyle={{ color: "white" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});

export function PortfolioAllocation() {
  const { allocation: data, exposurePct, totalBalance } = useDashboard();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-[#222220] border border-[#333330] rounded-xl p-5 flex flex-col h-full shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-serif font-bold tracking-wide text-white flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-claude-coral" />
          KELLY ALLOCATION
        </h2>
      </div>

      <div className="flex-1 flex flex-col relative min-h-0">
        <div className="h-[180px] w-full">
          {mounted ? (
            <MemoizedPieChart data={data} />
          ) : (
            <div className="h-full flex items-center justify-center text-[#7c7a72] font-mono text-[10px]">
              Loading chart...
            </div>
          )}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-35px]">
          <span className="text-[10px] font-mono text-[#7c7a72]">EXPOSURE</span>
          <span className={`text-lg font-bold font-mono ${exposurePct > 0 ? "text-claude-blue" : "text-[#7c7a72]"}`}>
            {exposurePct.toFixed(1)}%
          </span>
          {totalBalance > 0 && (
            <span className="text-[9px] font-mono text-[#7c7a72] mt-0.5">
              ${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>

        <div className="space-y-1.5 mt-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
          {data.map((item: AllocationItem, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[#a5a39a] truncate max-w-[120px]">{item.name}</span>
              </div>
              <span className="text-white font-semibold">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
