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

export type Position = {
  symbol: string;
  side: string;
  size: number;
  entry_price: number;
  mark_price: number;
  pnl: number;
  pnl_pct: string;
  leverage: number;
  liquidation_price: number;
};

export type Trade = {
  id: string;
  symbol: string;
  side: string;
  size: number;
  entry_price: number;
  pnl: number;
  status: string;
  timestamp: string;
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
  isRunning: boolean;
  botStatus: { is_running: boolean; last_execution: string | null; last_result: string | null };

  // Completed Trade History
  trades: Trade[];

  // Live Binance Positions
  positions: Position[];

  // Pipeline
  pipeline: PipelineColumn[];

  // Allocation
  allocation: AllocationItem[];
  exposurePct: number;
  totalBalance: number;
  totalUnrealizedPnl: number;

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
  { name: "Cash (Reserve)", value: 100, color: "#1E1D24" },
];

const DEFAULT_PIPELINE: PipelineColumn[] = [
  { title: "RESEARCH", color: "border-color-green", bg: "bg-color-green/8", text: "text-color-green", items: [] },
  { title: "BACKTEST", color: "border-accent-purple", bg: "bg-accent-purple/8", text: "text-accent-purple", items: [] },
  { title: "RISK REVIEW", color: "border-accent-orange", bg: "bg-accent-orange/8", text: "text-accent-orange", items: [] },
];

const INITIAL_DATA: DashboardData = {
  totalPnl: 0,
  winRate: 0,
  activeStrategies: 0,
  drawdown: 0,
  totalExecutions: 0,
  isRunning: false,
  botStatus: { is_running: false, last_execution: null, last_result: null },
  trades: [],
  positions: [],
  pipeline: DEFAULT_PIPELINE,
  allocation: DEFAULT_ALLOCATION,
  exposurePct: 0,
  totalBalance: 0,
  totalUnrealizedPnl: 0,
  logs: DEFAULT_LOGS,
  lastUpdated: null,
  isLoading: true,
};

// ── Helpers to map raw API data ────────────────────────────────────────────

function mapPositions(positions: any[]): Position[] {
  return (positions || []).map((p: any) => ({
    symbol: p.symbol,
    side: p.side,
    size: p.size,
    entry_price: p.entry_price,
    mark_price: p.mark_price,
    pnl: p.pnl,
    pnl_pct: p.pnl_pct,
    leverage: p.leverage ?? 20,
    liquidation_price: p.liquidation_price ?? 0,
  }));
}

function mapTradeHistory(history: any[]): Trade[] {
  return (history || []).map((t: any) => ({
    id: t.id,
    symbol: t.symbol,
    side: t.side,
    size: t.size,
    entry_price: t.entry_price,
    pnl: t.pnl ?? 0,
    status: t.status,
    timestamp: t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : "--",
  }));
}

function mapAllocation(result: any): {
  allocation: AllocationItem[];
  exposurePct: number;
  totalBalance: number;
  totalUnrealizedPnl: number;
} {
  const ALLOCATION_COLORS: Record<string, string> = {
    cash: "#1E1D24",
    "cash (reserve)": "#1E1D24",
    "#333333": "#1E1D24",
    "#00f0ff": "#00F0FF",
    "#ff00ff": "#7E66F5",
  };

  if (result?.allocations?.length > 0) {
    return {
      allocation: result.allocations.map((item: any) => ({
        ...item,
        color: ALLOCATION_COLORS[item.color] || ALLOCATION_COLORS[item.name?.toLowerCase()] || item.color,
      })),
      exposurePct: result.exposure_pct ?? 0,
      totalBalance: result.total_balance ?? 0,
      totalUnrealizedPnl: result.total_unrealized_pnl ?? 0,
    };
  }
  return { allocation: DEFAULT_ALLOCATION, exposurePct: 0, totalBalance: 0, totalUnrealizedPnl: 0 };
}

function mapPipeline(data: any): PipelineColumn[] {
  if (!data) return DEFAULT_PIPELINE;
  return [
    { title: "RESEARCH", color: "border-color-green", bg: "bg-color-green/8", text: "text-color-green", items: data.research || [] },
    { title: "BACKTEST", color: "border-accent-purple", bg: "bg-accent-purple/8", text: "text-accent-purple", items: data.backtest || [] },
    { title: "RISK REVIEW", color: "border-accent-orange", bg: "bg-accent-orange/8", text: "text-accent-orange", items: data.risk_review || [] },
  ];
}

// ── Context ────────────────────────────────────────────────────────────────

export type DashboardContextProps = DashboardData & {
  activeView: string;
  setActiveView: (view: string) => void;
};

const DashboardContext = createContext<DashboardContextProps>({
  ...INITIAL_DATA,
  activeView: "overview",
  setActiveView: () => {},
});
const RefreshContext = createContext<() => Promise<void>>(async () => {});

// ── Provider ───────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 10_000; // Single 10s interval replaces 7 separate timers

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData>(INITIAL_DATA);
  const [activeView, setActiveView] = useState<string>("overview");
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
        isRunning: bs?.is_running ?? false,
        botStatus: {
          is_running: bs?.is_running ?? false,
          last_execution: bs?.last_execution ?? null,
          last_result: bs?.last_result ?? null,
        },
        trades: mapTradeHistory(tradeHistory || []),
        positions: mapPositions(positions || []),
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
    <DashboardContext.Provider value={{ ...data, activeView, setActiveView }}>
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
