import type { Metadata } from "next";
import { Lora, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { DashboardProvider } from "@/lib/dashboard-context";
import "./globals.css";

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kronos | Autonomous AI Quant Hedge Fund",
  description: "CIO Dashboard for the Kronos Autonomous AI Quant Hedge Fund for Crypto Futures",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${lora.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col text-sm selection:bg-[#e0573e] selection:text-white">
        <DashboardProvider>{children}</DashboardProvider>
      </body>
    </html>
  );
}
