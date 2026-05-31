"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { fetchAllocation } from "@/lib/api";

type AllocationItem = {
  name: string;
  value: number;
  color: string;
};

export function PortfolioAllocation() {
  const [data, setData] = useState<AllocationItem[]>([{ name: "Cash (Reserve)", value: 100, color: "#333333" }]);
  const [exposurePct, setExposurePct] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);

  const refreshAllocation = useCallback(async () => {
    try {
      const result = await fetchAllocation();
      if (result && result.allocations && result.allocations.length > 0) {
        setData(result.allocations);
        setExposurePct(result.exposure_pct ?? 0);
        setTotalBalance(result.total_balance ?? 0);
      }
    } catch {
      // backend unreachable
    }
  }, []);

  useEffect(() => {
    refreshAllocation();
    const interval = setInterval(refreshAllocation, 10000);
    return () => clearInterval(interval);
  }, [refreshAllocation]);

  return (
    <div className="glass-panel rounded-lg p-5 flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-bold tracking-wider text-white flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-magenta-neon" />
          KELLY ALLOCATION
        </h2>
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 15, 18, 0.9)",
                  borderColor: "rgba(255,255,255,0.1)",
                  color: "white",
                }}
                itemStyle={{ color: "white", fontFamily: "monospace" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-50px]">
          <span className="text-xs font-mono text-zinc-500">EXPOSURE</span>
          <span className={`text-xl font-bold font-mono ${exposurePct > 0 ? "text-cyan-neon" : "text-zinc-600"}`}>
            {exposurePct.toFixed(1)}%
          </span>
          {totalBalance > 0 && (
            <span className="text-[10px] font-mono text-zinc-500 mt-1">
              ${totalBalance.toLocaleString()}
            </span>
          )}
        </div>

        <div className="space-y-2 mt-4">
          {data.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-zinc-300">{item.name}</span>
              </div>
              <span className="text-white">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
