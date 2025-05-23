"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

// Use ComponentProps to get the props type from NextThemesProvider
type ActualThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ActualThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
