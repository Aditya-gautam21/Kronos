"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { fetchAllDashboardData } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

export type LogEntry = {
  id: number;
  agent: string;
  message: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error";
};

export type QueueItem = {
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

export type Trade = {
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

export type AllocationItem = {
  name: string;
  value: number;
  color: string;
};

export type PipelineColumn = {
  title: string;
  color: string;
  bg: string;
  text: string;
  items: { id: string; time: string; desc: string }[];
};

type DashboardData = {
  // Metrics
  totalPnl: number;
  winRate: number;
  activeStrategies: number;
  drawdown: number;
  totalExecutions: number;

  // Bot status
  botStatus: { message: string; type: "success" | "error" | null };

  // Trades
  trades: Trade[];

  // Approval queue (active trades)
  queue: QueueItem[];

  // Pipeline
  pipeline: PipelineColumn[];

  // Allocation
  allocation: AllocationItem[];
  exposurePct: number;
  totalBalance: number;

  // Logs
  logs: LogEntry[];

  // Meta
  lastUpdated: number | null;
  isLoading: boolean;
};

const DEFAULT_LOGS: LogEntry[] = [
  { id: 1, agent: "SYSTEM", message: "System standing by. Waiting for CIO to initiate autonomous trading.", timestamp: "00:00:00.000", type: "info" },
];

const DEFAULT_ALLOCATION: AllocationItem[] = [
  { name: "Cash (Reserve)", value: 100, color: "#333330" },
];

const DEFAULT_PIPELINE: PipelineColumn[] = [
  { title: "RESEARCH", color: "border-claude-blue", bg: "bg-claude-blue/8", text: "text-claude-blue", items: [] },
  { title: "BACKTEST", color: "border-claude-coral", bg: "bg-claude-coral/8", text: "text-claude-coral", items: [] },
  { title: "RISK REVIEW", color: "border-claude-green", bg: "bg-claude-green/8", text: "text-claude-green", items: [] },
];

const INITIAL_DATA: DashboardData = {
  totalPnl: 0,
  winRate: 0,
  activeStrategies: 0,
  drawdown: 0,
  totalExecutions: 0,
  botStatus: { message: "", type: null },
  trades: [],
  queue: [],
  pipeline: DEFAULT_PIPELINE,
  allocation: DEFAULT_ALLOCATION,
  exposurePct: 0,
  totalBalance: 0,
  logs: DEFAULT_LOGS,
  lastUpdated: null,
  isLoading: true,
};

// ── Helpers to map raw API data ────────────────────────────────────────────

function mapQueue(history: any[]): QueueItem[] {
  return history
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
}

function mapTrades(positions: any[], history: any[]): Trade[] {
  const active: Trade[] = positions.map((p: any) => ({
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

  const past: Trade[] = history
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

  return [...active, ...past];
}

function mapAllocation(result: any): {
  allocation: AllocationItem[];
  exposurePct: number;
  totalBalance: number;
} {
  const ALLOCATION_COLORS: Record<string, string> = {
    cash: "#333330",
    "#333333": "#333330",
    "#00f0ff": "#788c5d",
    "#ff00ff": "#e0573e",
  };

  if (result?.allocations?.length > 0) {
    return {
      allocation: result.allocations.map((item: any) => ({
        ...item,
        color: ALLOCATION_COLORS[item.color] || ALLOCATION_COLORS[item.name?.toLowerCase()] || item.color,
      })),
      exposurePct: result.exposure_pct ?? 0,
      totalBalance: result.total_balance ?? 0,
    };
  }
  return { allocation: DEFAULT_ALLOCATION, exposurePct: 0, totalBalance: 0 };
}

function mapPipeline(data: any): PipelineColumn[] {
  if (!data) return DEFAULT_PIPELINE;
  return [
    { title: "RESEARCH", color: "border-claude-blue", bg: "bg-claude-blue/8", text: "text-claude-blue", items: data.research || [] },
    { title: "BACKTEST", color: "border-claude-coral", bg: "bg-claude-coral/8", text: "text-claude-coral", items: data.backtest || [] },
    { title: "RISK REVIEW", color: "border-claude-green", bg: "bg-claude-green/8", text: "text-claude-green", items: data.risk_review || [] },
  ];
}

// ── Context ────────────────────────────────────────────────────────────────

const DashboardContext = createContext<DashboardData>(INITIAL_DATA);
const RefreshContext = createContext<() => Promise<void>>(async () => {});

// ── Provider ───────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 10_000; // Single 10s interval replaces 7 separate timers

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData>(INITIAL_DATA);
  const mountedRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    // Abort any in-flight request before starting a new one
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const all = await fetchAllDashboardData(controller.signal);

      // Don't update state if component unmounted or request was aborted
      if (!mountedRef.current || controller.signal.aborted) return;

      const {
        metrics: m,
        botStatus: bs,
        positions,
        tradeHistory,
        pipeline: pipe,
        allocation: alloc,
        logs: rawLogs,
      } = all;

      setData({
        totalPnl: m?.total_pnl ?? 0,
        winRate: m?.win_rate ?? 0,
        activeStrategies: m?.active_strategies ?? 0,
        drawdown: m?.drawdown ?? 0,
        totalExecutions: bs?.total_executions ?? 0,
        botStatus: { message: "", type: null },
        trades: mapTrades(positions || [], tradeHistory || []),
        queue: mapQueue(tradeHistory || []),
        pipeline: mapPipeline(pipe),
        ...mapAllocation(alloc),
        logs: Array.isArray(rawLogs) && rawLogs.length > 0 ? rawLogs : DEFAULT_LOGS,
        lastUpdated: Date.now(),
        isLoading: false,
      });
    } catch (err: any) {
      if (err?.name === "AbortError" || !mountedRef.current) return;
      // Keep last-known-good data on transient errors
      setData((prev) => ({ ...prev, isLoading: prev.lastUpdated === null }));
    }
  }, []);

  // Initial fetch + single polling interval
  useEffect(() => {
    mountedRef.current = true;
    refresh();

    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      controllerRef.current?.abort();
    };
  }, [refresh]);

  return (
    <DashboardContext.Provider value={data}>
      <RefreshContext.Provider value={refresh}>
        {children}
      </RefreshContext.Provider>
    </DashboardContext.Provider>
  );
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useDashboard() {
  return useContext(DashboardContext);
}

export function useRefresh() {
  return useContext(RefreshContext);
}
