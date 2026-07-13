"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useDashboard } from "@/lib/dashboard-context";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#06b6d4", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export function PortfolioAllocation() {
  const { allocation, exposurePct, totalBalance } = useDashboard();

  return (
    <div className="card p-5 flex flex-col h-full">
      <h2 className="text-sm font-semibold mb-3">Portfolio Allocation</h2>

      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <div className="h-[170px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={allocation} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={2} dataKey="value" stroke="none">
                {allocation.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", fontSize: "12px", color: "#fafafa" }}
                itemStyle={{ color: "#fafafa" }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Exposure</span>
            <span className="text-lg font-bold font-mono text-accent-blue">{exposurePct.toFixed(1)}%</span>
            {totalBalance > 0 && (
              <span className="text-[10px] text-text-tertiary font-mono mt-0.5">
                ${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            )}
          </div>
        </div>

        <div className="w-full space-y-1.5 mt-3">
          {allocation.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-text-secondary truncate max-w-[140px]">{item.name}</span>
              </div>
              <span className="font-mono font-medium">{item.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
