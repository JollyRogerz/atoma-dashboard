"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { VariantProps, cva } from "class-variance-authority";
import { PanelLeft } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Configuration constants for the sidebar
const SIDEBAR_COOKIE_NAME = "sidebar:state"; // Cookie name to persist sidebar state
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // Cookie duration: 7 days in seconds
const SIDEBAR_WIDTH = "16rem"; // Width of expanded sidebar on desktop
const SIDEBAR_WIDTH_MOBILE = "18rem"; // Width of sidebar on mobile devices
const SIDEBAR_WIDTH_ICON = "3rem"; // Width of collapsed sidebar in icon mode
const SIDEBAR_KEYBOARD_SHORTCUT = "b"; // Keyboard shortcut to toggle sidebar (Ctrl/Cmd + b)

// Type definition for the sidebar context
type SidebarContext = {
  state: "expanded" | "collapsed"; // Current visual state of sidebar
  open: boolean; // Whether the sidebar is open on desktop
  setOpen: (open: boolean) => void; // Function to set open state
  openMobile: boolean; // Whether the sidebar is open on mobile
  setOpenMobile: (open: boolean) => void; // Function to set mobile open state
  isMobile: boolean; // Whether the current device is mobile
  toggleSidebar: () => void; // Toggle sidebar open/closed based on device
};

// Create React context for sidebar state
const SidebarContext = React.createContext<SidebarContext | null>(null);

/**
 * Custom hook to access sidebar context
 * Must be used within a SidebarProvider component
 */
function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

/**
 * SidebarProvider - Provides sidebar state and functionality to child components
 * 
 * Props:
 * - defaultOpen: Whether sidebar is open by default
 * - open: Controlled open state
 * - onOpenChange: Callback when open state changes
 * - Plus standard div props
 */
const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
  // Check if current device is mobile
  const isMobile = useIsMobile();
  // State for mobile sidebar visibility
  const [openMobile, setOpenMobile] = React.useState(false);

  // Internal state for uncontrolled component
  const [_open, _setOpen] = React.useState(defaultOpen);
  // Use controlled prop if provided, otherwise use internal state
  const open = openProp ?? _open;
  
  // Function to update sidebar open state and persist to cookie
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        // Call parent callback if controlled component
        setOpenProp(openState);
      } else {
        // Update internal state if uncontrolled
        _setOpen(openState);
      }
      // Save state to cookie for persistence across page loads
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open]
  );

  // Toggle sidebar based on device type
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile(open => !open) : setOpen(open => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  // Add keyboard shortcut to toggle sidebar (Ctrl/Cmd + B)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // Create a data-state attribute for styling with Tailwind
  const state = open ? "expanded" : "collapsed";

  // Create context value with memoization for performance
  const contextValue = React.useMemo<SidebarContext>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          style={
            {
              // Set CSS variables for sidebar widths
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn("group/sidebar-wrapper flex h-screen w-full has-[[data-variant=inset]]:bg-sidebar", className)}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
});


SidebarProvider.displayName = "SidebarProvider";

/**
 * Sidebar - Main sidebar component that adapts to device and configuration
 * 
 * Props:
 * - side: Which side of the screen to display on
 * - variant: Visual style variant
 * - collapsible: How the sidebar collapses
 * - Plus standard div props
 */
const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"; // Which side the sidebar appears on
    variant?: "sidebar" | "floating" | "inset"; // Visual style of sidebar
    collapsible?: "offcanvas" | "icon" | "none"; // How sidebar collapses
  }
>(({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
  // Get sidebar state from context
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  // If sidebar is not collapsible, render a simple div
  if (collapsible === "none") {
    return (
      <div
        className={cn("flex h-screen w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground", className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }

  // On mobile, render sidebar as a slide-in sheet
  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-mobile="true"
          className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={
            {
              // Use mobile-specific width
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <div className="flex h-screen w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // On desktop, render the full sidebar with proper state attributes
  return (
    <div
      ref={ref}
      className="group peer hidden md:block text-sidebar-foreground"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
    >
      {/* This div handles the sidebar gap/spacing on desktop */}
      <div
        className={cn(
          "duration-200 relative h-screen w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
          "group-data-[collapsible=offcanvas]:w-0", // When offcanvas, collapse to zero width
          "group-data-[side=right]:rotate-180", // Flip when on right side
          // Adjust width for icon mode based on variant
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
            : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
        )}
      />
      {/* This div is the actual sidebar container */}
      <div
        className={cn(
          "duration-200 fixed inset-y-0 z-10 hidden h-screen w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
          // Position based on side (left/right)
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)_+_theme(spacing.4))]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)_+_theme(spacing.4))]"
        )}
      />
    </div>
  );
});

Sidebar.displayName = "Sidebar";

/**
 * Note: This component previously had additional UI components that were removed:
 * - SidebarTrigger: Button to toggle sidebar visibility
 * - SidebarRail: Draggable resize handle
 * - SidebarInset: Content container that adapts to sidebar state
 * - SidebarInput: Styled input field for search
 * - SidebarHeader/Footer: Containers for top/bottom content
 * - SidebarSeparator: Visual divider
 * - SidebarContent: Main scrollable content area
 * - SidebarGroup components: For grouping related items
 * - SidebarMenu components: For navigation menus and items
 * 
 * The current implementation is simplified but fully functional for basic sidebar needs.
 * The above components can be restored if needed for more advanced UI requirements.
 */

export {
  Sidebar,
  SidebarProvider,
  useSidebar,
};
