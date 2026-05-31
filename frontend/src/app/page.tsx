import { Sidebar } from "@/components/Sidebar";
import { MetricsRibbon } from "@/components/MetricsRibbon";
import { StrategyPipeline } from "@/components/StrategyPipeline";
import { ApprovalQueue } from "@/components/ApprovalQueue";
import { PortfolioAllocation } from "@/components/PortfolioAllocation";
import { LiveTrades } from "@/components/LiveTrades";
import { AgentLog } from "@/components/AgentLog";

export default function Dashboard() {
  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden text-white">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Gradient Overlay for depth */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-cyan-neon/5 to-transparent pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto p-6 z-10 custom-scrollbar">
          <MetricsRibbon />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 h-[320px]">
              <StrategyPipeline />
            </div>
            <div className="h-[320px]">
              <ApprovalQueue />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <div className="lg:col-span-3">
              <LiveTrades />
            </div>
            <div className="h-[360px]">
              <PortfolioAllocation />
            </div>
          </div>

          <div className="h-[250px]">
            <AgentLog />
          </div>
        </div>
      </main>
    </div>
  );
}
