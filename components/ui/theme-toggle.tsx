"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Initialize isToggled based on theme
  const [isToggled, setIsToggled] = React.useState(false);

  // Update isToggled when theme changes
  React.useEffect(() => {
    setIsToggled(theme === "dark");
  }, [theme]);

  // Handle mounting
  React.useEffect(() => {
    setMounted(true);
    setIsToggled(theme === "dark");
  }, []);

  if (!mounted) {
    return <div className="h-8 w-14 rounded-full bg-muted animate-pulse" />;
  }

  const handleToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    setIsToggled(newTheme === "dark");
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "relative h-8 w-14 rounded-full transition-colors duration-300",
        "bg-white dark:bg-darkMode",
        "shadow-sm dark:shadow-darkMode",
        "border border-slate-200 dark:border-darkMode",
        "hover:bg-slate-50 dark:hover:bg-darkMode"
      )}
    >
      <div
        className={cn(
          "absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-300",
          "flex items-center justify-center",
          isToggled && "translate-x-6 bg-white"
        )}
      >
        {/* Sun Icon */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
            isToggled ? "opacity-0" : "opacity-100"
          )}
        >
          <svg
            className="h-5 w-5 text-amber-500"
            viewBox="0 0 16 16"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z" />
          </svg>
        </div>
        {/* Moon Icon */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
            isToggled ? "opacity-100" : "opacity-0"
          )}
        >
          <svg
            className="h-4 w-4 text-slate-700"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </div>
      </div>

      {/* Background Icons */}
      <div className="relative h-full">
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-between px-2 transition-opacity duration-300",
            isToggled ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="h-4 w-4" />
          <div className="h-5 w-5 rounded-full bg-amber-500/20" />
        </div>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-between px-2 transition-opacity duration-300",
            isToggled ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="h-4 w-4 rounded-full bg-white/20" />
          <div className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
}
