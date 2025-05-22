"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Network,
  Settings,
  HelpCircle,
  Menu,
  ChevronLeft,
  Box,
  PlayCircle,
  FileText,
  LayoutDashboard,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { useSettings } from "@/contexts/settings-context";
import React from "react";
import NavItem from "@/components/NavItem";

const navigation = [
  { name: "Network Status", href: "/", icon: Network },
  { name: "Account Portal", href: "/account-portal", icon: LayoutDashboard },
  { name: "Models", href: "/models", icon: Box },
  { name: "Playground", href: "/playground", icon: PlayCircle },
  // { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Guide", href: "/guide", icon: GraduationCap },
  // External links moved to the bottom:
  { name: "Docs", href: "https://docs.atoma.network/cloud-api-reference/get-started", icon: FileText },
  {
    name: "Help",
    href: "https://docs.google.com/forms/d/e/1FAIpQLSeE-AV0oEfo6YGtzo0Ts_vvnm8Crtf1kVhdBtANulH11c0OTA/viewform",
    icon: HelpCircle,
  },
];

// Remove or empty the bottomNavigation array since we moved its items
const bottomNavigation: any = [];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render the full component after client-side hydration
  if (!mounted) {
    return (
      <div
        className={cn(
          "fixed inset-y-0 z-20 flex flex-col bg-background dark:bg-darkMode border-r border-border transition-all duration-300 ease-in-out lg:static",
          "-left-full lg:left-0"
        )}
      >
        {/* Minimal content for server rendering */}
        <div className="border-b border-border dark:bg-darkMode">
          <div className="flex h-16 items-center gap-2 px-4 dark:bg-darkMode">
            <div className="flex items-center font-semibold">
              <div className="h-[140px] w-[140px]" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto dark:bg-darkMode"></div>
        <div className="p-2 dark:bg-darkMode"></div>
      </div>
    );
  }

  return (
    <TooltipPrimitive.Provider delayDuration={0} skipDelayDuration={0}>
      <>
        <button
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background dark:bg-darkMode rounded-md"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div
          className={cn(
            "fixed inset-y-0 z-10 flex flex-col bg-background dark:bg-darkMode border-r border-border transition-[width] duration-300 ease-in-out lg:relative",
            isCollapsed ? "w-[56px]" : "w-60",
            isMobileOpen ? "left-0" : "-left-full lg:left-0"
          )}
          style={{ height: "100vh", minHeight: "100vh" }}
        >
          <div className="border-b border-border dark:bg-darkMode">
            <div
              className={cn("flex h-16 items-center justify-between dark:bg-darkMode", isCollapsed && "justify-center")}
            >
              {!isCollapsed && (
                <div className="flex items-center w-full">
                  <div className="sidebar-logo-container pl-[34px] flex items-center justify-between">
                    <Image
                      alt="atoma logo"
                      src="/logos/alpha_logo_atoma_light.svg"
                      height={180}
                      width={180}
                      className="block dark:hidden"
                      priority
                    />
                    <Image
                      alt="atoma logo"
                      src="/logos/alpha_logo_atoma_dark.svg"
                      height={180}
                      width={180}
                      className="hidden dark:block"
                      priority
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-0 h-8 w-8 -ml-4"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                  >
                    <ChevronLeft
                      className={cn(
                        "h-6 w-6 transition-transform duration-200 ease-out text-[#635c70] dark:text-[#8f8f98] hover:text-secondary-foreground dark:hover:text-secondary-foreground",
                        isCollapsed && "rotate-180"
                      )}
                    />
                    <span className="sr-only">{isCollapsed ? "Expand" : "Collapse"} Sidebar</span>
                  </Button>
                </div>
              )}
              {isCollapsed && (
                <Button variant="ghost" size="sm" className="px-0 h-8 w-8" onClick={() => setIsCollapsed(!isCollapsed)}>
                  <ChevronLeft
                    className={cn(
                      "h-6 w-6 transition-transform duration-200 ease-out text-[#635c70] dark:text-[#8f8f98] hover:text-secondary-foreground dark:hover:text-secondary-foreground",
                      isCollapsed && "rotate-180"
                    )}
                  />
                  <span className="sr-only">{isCollapsed ? "Expand" : "Collapse"} Sidebar</span>
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto dark:bg-darkMode">
            <nav className="flex-1 space-y-2 px-2 py-4 dark:text-[#8f8f98]">
              {navigation.map(
                item =>
                  (item.name !== "Settings" || settings.loggedIn) && (
                    <NavItem key={item.name} item={item} isCollapsed={isCollapsed} mounted={mounted} />
                  )
              )}
            </nav>
          </div>
          <div className="p-2 dark:bg-darkMode">
            <nav className="space-y-1">
              {bottomNavigation.map((item: any) => (
                <NavItem key={item.name} item={item} isBottom isCollapsed={isCollapsed} mounted={mounted} />
              ))}
            </nav>
          </div>
        </div>
      </>
    </TooltipPrimitive.Provider>
  );
}
