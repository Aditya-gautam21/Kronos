import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { DashboardProvider } from "@/lib/dashboard-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kronos — Autonomous AI Quant Fund",
  description: "CIO Dashboard for the Kronos autonomous crypto futures trading system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary">
        <DashboardProvider>{children}</DashboardProvider>
      </body>
    </html>
  );
}
