"use client";

import { Activity } from "lucide-react";
import { useDashboard, type Trade } from "@/lib/dashboard-context";

export function LiveTrades() {
  const { trades } = useDashboard();

  return (
    <div className="bg-[#222220] border border-[#333330] rounded-xl p-5 flex flex-col h-full shadow-sm">
      <div className="flex justify-between items-center mb-4 border-b border-[#333330] pb-3">
        <h2 className="text-sm font-serif font-bold tracking-wide text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-claude-coral" />
          ACTIVE PAPER TRADES
        </h2>
        <div className="text-[10px] font-mono text-[#a5a39a] bg-[#1a1a19] border border-[#333330] px-2 py-0.5 rounded">BINANCE TESTNET</div>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-[#333330] text-[#7c7a72]">
              <th className="pb-3 font-semibold">SYMBOL</th>
              <th className="pb-3 font-semibold">SIDE</th>
              <th className="pb-3 font-semibold text-right">SIZE</th>
              <th className="pb-3 font-semibold text-right">ENTRY</th>
              <th className="pb-3 font-semibold text-right">MARKET</th>
              <th className="pb-3 font-semibold text-right">PNL</th>
              <th className="pb-3 font-semibold text-right">TIME</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#7c7a72] font-mono italic">
                  No active trades currently. System is standing by.
                </td>
              </tr>
            ) : (
              trades.map((trade: Trade) => (
                <tr key={trade.id} className="border-b border-[#333330]/50 hover:bg-[#1a1a19]/40 transition-colors duration-150">
                  <td className="py-2.5 font-bold text-white">{trade.symbol}</td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        trade.side === "LONG"
                          ? "bg-claude-green/10 text-claude-green border border-claude-green/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {trade.side}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-[#a5a39a]">{trade.size}</td>
                  <td className="py-2.5 text-right text-[#7c7a72]">
                    ${trade.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right text-white font-semibold">
                    ${trade.mark_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className={`py-2.5 text-right font-bold ${
                      trade.pnl >= 0 ? "text-claude-green" : "text-red-400"
                    }`}
                  >
                    {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}{" "}
                    <span className="text-[10px] opacity-70 ml-1 font-normal">{trade.pnl_pct}</span>
                  </td>
                  <td className="py-2.5 text-right text-[#7c7a72]">{trade.timestamp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
