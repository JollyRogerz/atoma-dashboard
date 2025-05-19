"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export interface NavItemProps {
  // Exporting interface
  item: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  isBottom?: boolean;
  isCollapsed: boolean;
  mounted: boolean; // Assuming 'mounted' prop is primarily for controlling rendering during hydration phase in parent
}

const NavItem = React.memo(({ item, isBottom = false, isCollapsed, mounted }: NavItemProps) => {
  const pathname = usePathname();

  // If not mounted (e.g., during SSR or before client-side hydration of parent completes rendering this part),
  // optionally render nothing or a minimal placeholder to avoid hydration mismatches if content depends on client state.
  // However, given NavItem is usually called by Sidebar AFTER Sidebar itself is mounted, this might not be strictly needed here.
  // For now, we assume 'mounted' is correctly handled by the parent (Sidebar).

  const content = (
    <>
      <item.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
      {!isCollapsed && <span>{item.name}</span>}
    </>
  );

  const linkContent = item.href.startsWith("http") ? (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center rounded-md px-[34px] py-3 text-base font-medium sidebar-item",
        pathname === item.href
          ? "bg-secondary dark:bg-[#27272a] text-secondary-foreground"
          : "text-muted-foreground hover:bg-secondary/80 hover:dark:bg-[#27272a] hover:text-secondary-foreground",
        isCollapsed && "justify-center px-3"
      )}
    >
      {content}
    </a>
  ) : (
    <Link
      href={item.href}
      className={cn(
        "flex items-center rounded-md px-[34px] py-3 text-base font-medium sidebar-item",
        pathname === item.href
          ? "bg-secondary dark:bg-[#27272a] text-secondary-foreground"
          : "text-muted-foreground hover:bg-secondary/80 hover:dark:bg-[#27272a] hover:text-secondary-foreground",
        isCollapsed && "justify-center px-3"
      )}
    >
      {content}
    </Link>
  );

  if (!isCollapsed) {
    return linkContent;
  }

  // Tooltip for collapsed state
  return (
    <TooltipPrimitive.Provider delayDuration={0}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{linkContent}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="right"
            sideOffset={10}
            className="z-[99999] rounded-md bg-popover px-3 py-1.5 text-sm text-popover-foreground animate-in fade-in-0 zoom-in-95 shadow-md"
          >
            {item.name}
            <TooltipPrimitive.Arrow className="fill-popover" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
});

NavItem.displayName = "NavItem";

export default NavItem; // Default export for easier dynamic import if ever needed, and common practice
