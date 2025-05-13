import "./globals.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ThemeProvider } from "next-themes";
import { SettingsProvider } from "@/contexts/settings-context";
import { AppStateProvider } from "@/contexts/app-state";
import type React from "react";
import { Toaster } from "sonner";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import SuiWrap from "@/contexts/SuiWrap";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import ClientWrapper from "./client-wrapper";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import ClientWrapper from "./client-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Atoma Cloud",
  description: "Distributed AI inference of the largest open-source AI models for text, voice, and image generation.",
  generator: "v0.dev",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon.ico" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark:bg-transparent">
      <body className={cn(inter.className, "dark:bg-transparent bg-transparent")}>
    <html lang="en" suppressHydrationWarning className="dark:bg-transparent">
      <body className={cn(inter.className, "dark:bg-transparent bg-transparent")}>
        <SettingsProvider>
          <AppStateProvider>
            <SuiWrap>
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <TooltipProvider delayDuration={0}>
                  <ClientWrapper>
                    <div className="h-screen flex overflow-hidden bg-transparent">
                    <div className="h-screen flex overflow-hidden bg-transparent">
                      <Sidebar />
                      <div className="flex-1 flex flex-col h-screen bg-transparent">
                        <TopNav />
                        <div className="w-full p-4 flex-1 overflow-auto bg-transparent">
                          <main className="w-full h-full bg-transparent">{children}</main>
                        </div>
                      </div>
                    </div>
                  </ClientWrapper>
                  <Toaster />
                </TooltipProvider>
              </ThemeProvider>
            </SuiWrap>
          </AppStateProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
