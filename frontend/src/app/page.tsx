"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHome } from "@/components/DashboardHome";
import { LiveTrades } from "@/components/LiveTrades";
import { PortfolioAllocation } from "@/components/PortfolioAllocation";
import { TradeHistoryTable } from "@/components/TradeHistoryTable";
import { AgentOperations } from "@/components/AgentOperations";
import { useDashboard } from "@/lib/dashboard-context";

export default function Dashboard() {
  const { activeView } = useDashboard();

  return (
    <div className="flex h-screen w-full bg-bg-primary overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {activeView === "overview" && <DashboardHome />}
            {activeView === "positions" && (
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <LiveTrades />
              </div>
            )}
            {activeView === "history" && (
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TradeHistoryTable />
                </div>
                <div>
                  <PortfolioAllocation />
                </div>
              </div>
            )}
            {activeView === "operations" && <AgentOperations />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
