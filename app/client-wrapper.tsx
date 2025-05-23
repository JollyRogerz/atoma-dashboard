"use client";

import { useState, useEffect } from "react";
import { ToastProvider } from "./toast-provider";
import { BackgroundGrid } from "@/components/background-grid";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ToastProvider>
      <div className="relative w-full min-h-screen">
        {mounted && <BackgroundGrid />}
        <div className="relative z-[1]">
          {children}
        </div>
      </div>
    </ToastProvider>
  );
}
