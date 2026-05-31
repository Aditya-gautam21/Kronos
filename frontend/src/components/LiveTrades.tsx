"use client";

import { Activity } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { fetchPositions, fetchTradeHistory } from "@/lib/api";

type Trade = {
  id: string;
  symbol: string;
  side: string;
  size: number;
  entry_price: number;
  mark_price: number;
  pnl: number;
  pnl_pct: string;
  status?: string;
  timestamp?: string;
};

export function LiveTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);

  const refreshTrades = useCallback(async () => {
    try {
      const [positions, history] = await Promise.all([fetchPositions(), fetchTradeHistory()]);

      const activeTrades: Trade[] = positions.map((p: any) => ({
        id: p.symbol,
        symbol: p.symbol,
        side: p.side,
        size: p.size,
        entry_price: p.entry_price,
        mark_price: p.mark_price,
        pnl: p.pnl,
        pnl_pct: p.pnl_pct,
        status: "active",
        timestamp: "now",
      }));

      const pastTrades: Trade[] = history
        .filter((t: any) => t.status !== "active")
        .map((t: any) => ({
          id: t.id,
          symbol: t.symbol,
          side: t.side,
          size: t.size,
          entry_price: t.entry_price,
          mark_price: t.entry_price,
          pnl: t.pnl ?? 0,
          pnl_pct: "0.00%",
          status: t.status,
          timestamp: t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : "--",
        }));

      setTrades([...activeTrades, ...pastTrades]);
    } catch {
      // backend unreachable
    }
  }, []);

  useEffect(() => {
    refreshTrades();
    const interval = setInterval(refreshTrades, 5000);
    return () => clearInterval(interval);
  }, [refreshTrades]);

  return (
    <div className="glass-panel rounded-lg p-5 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold tracking-wider text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-neon" />
          ACTIVE PAPER TRADES
        </h2>
        <div className="text-xs font-mono text-zinc-500">BINANCE TESTNET</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-panel-border text-zinc-500">
              <th className="pb-3 font-normal">SYMBOL</th>
              <th className="pb-3 font-normal">SIDE</th>
              <th className="pb-3 font-normal text-right">SIZE</th>
              <th className="pb-3 font-normal text-right">ENTRY</th>
              <th className="pb-3 font-normal text-right">MARKET</th>
              <th className="pb-3 font-normal text-right">PNL</th>
              <th className="pb-3 font-normal text-right">TIME</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-600 font-mono italic">
                  No active trades currently. System is standing by.
                </td>
              </tr>
            ) : (
              trades.map((trade) => (
                <tr key={trade.id} className="border-b border-panel-border/50 hover:bg-white/5 transition-colors">
                  <td className="py-3 font-bold text-white">{trade.symbol}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        trade.side === "LONG"
                          ? "bg-green-neon/20 text-green-neon border border-green-neon/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {trade.side}
                    </span>
                  </td>
                  <td className="py-3 text-right text-zinc-300">{trade.size}</td>
                  <td className="py-3 text-right text-zinc-400">
                    ${trade.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right text-white font-bold">
                    ${trade.mark_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className={`py-3 text-right font-bold ${
                      trade.pnl >= 0 ? "text-green-neon" : "text-red-400"
                    }`}
                  >
                    {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}{" "}
                    <span className="text-[10px] opacity-70 ml-1">{trade.pnl_pct}</span>
                  </td>
                  <td className="py-3 text-right text-zinc-500">{trade.timestamp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
