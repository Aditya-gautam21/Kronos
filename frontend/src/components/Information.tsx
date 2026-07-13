"use client";

import { Info, HelpCircle, Terminal, Cpu, Database, Landmark } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-context";

export function Information() {
  const { totalPnl, winRate, totalExecutions, totalBalance } = useDashboard();

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar p-6 z-10 space-y-6">
      {/* Editorial Header */}
      <section className="bg-[#141318] border border-[#1E1D24] rounded-2xl p-6 shadow-sm select-none">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-sans tracking-wide">
          <Info className="w-5 h-5 text-[#EB6B44]" />
          Kronos Terminal Guidance
        </h2>
        <p className="text-xs text-[#9A99A2] font-sans mt-2 max-w-2xl leading-relaxed">
          Kronos is an autonomous AI hedge fund operating on crypto futures. The system coordinates multiple specialized agents (Research, Quant, Risk Review, and Execution) to perform real-time signal generation, backtesting, and automated trades on the Binance Testnet.
        </p>
      </section>

      {/* Grid statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        
        {/* Card 1: Pipeline Engine */}
        <div className="bg-[#141318] border border-[#1E1D24] rounded-2xl p-5 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#EB6B44]/10 border border-[#EB6B44]/20 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-[#EB6B44]" />
          </div>
          <span className="text-xs font-bold text-white font-sans">Pipeline Orchestrator</span>
          <p className="text-[11px] text-[#9A99A2] leading-normal font-sans">
            A central scheduler coordinates research scripts, triggers backtests, and validates entry/exit check-levels. It parses results through LLM reasoning loops to select the optimal trades.
          </p>
        </div>

        {/* Card 2: Database Sync */}
        <div className="bg-[#141318] border border-[#1E1D24] rounded-2xl p-5 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#7E66F5]/10 border border-[#7E66F5]/20 flex items-center justify-center">
            <Database className="w-4 h-4 text-[#7E66F5]" />
          </div>
          <span className="text-xs font-bold text-white font-sans">Supabase Telemetry</span>
          <p className="text-[11px] text-[#9A99A2] leading-normal font-sans">
            All trades, raw ticker data, agent hypotheses, and metrics are written directly to Supabase. The frontend updates dynamically via polling of the FastAPI local gateway.
          </p>
        </div>

        {/* Card 3: Risk Parameters */}
        <div className="bg-[#141318] border border-[#1E1D24] rounded-2xl p-5 flex flex-col gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center">
            <Landmark className="w-4 h-4 text-[#00F0FF]" />
          </div>
          <span className="text-xs font-bold text-white font-sans">Risk Telemetry</span>
          <p className="text-[11px] text-[#9A99A2] leading-normal font-sans">
            Leverage constraints are strictly locked at 20x. Maximum global drawdown is set to -5.0%. Position sizing employs a dynamic fraction model to safeguard funds.
          </p>
        </div>
      </div>

      {/* Manual FAQ accordion */}
      <section className="bg-[#141318] border border-[#1E1D24] rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 font-sans flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#EB6B44]" />
          System Settings & Telemetry Details
        </h3>
        
        <div className="space-y-4 font-sans text-xs">
          <div className="border-b border-[#1E1D24] pb-3.5">
            <span className="text-white font-semibold block mb-1">What does triggering the "Agent Run" do?</span>
            <p className="text-[#9A99A2] leading-normal">
              Clicking "Trigger Agent Run" calls the <code>/save-data</code> endpoint. It launches the QuantAgent, executes market scans, logs hypotheses, performs live risk validation, and writes results to the Supabase schemas.
            </p>
          </div>

          <div className="border-b border-[#1E1D24] pb-3.5">
            <span className="text-white font-semibold block mb-1">How does the "Scheduler" work?</span>
            <p className="text-[#9A99A2] leading-normal">
              Starting the scheduler via the <code>/start-bot</code> endpoint spins up a background thread that executes trade orchestration cycles on a recurring interval. Telemetry updates will flow dynamically to the stream logs.
            </p>
          </div>

          <div className="pb-1">
            <span className="text-white font-semibold block mb-1">How can I review active positions?</span>
            <p className="text-[#9A99A2] leading-normal">
              Click the "Markets" tab in the sidebar navigation. It maps directly to live futures contracts retrieved via <code>/positions</code> from the Binance REST API.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
