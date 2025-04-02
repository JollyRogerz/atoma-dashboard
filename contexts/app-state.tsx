"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";

export interface AppState {
  showLogin: boolean;
  refreshBalance: boolean;
}

const defaultAppState: AppState = {
  showLogin: false,
  refreshBalance: false,
};

interface AppContextType {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultAppState);

  const updateState = (newSettings: Partial<AppState>) => {
    setState(prev => {
      const updatedSettings = { ...prev, ...newSettings };
      sessionStorage.setItem("appState", JSON.stringify(updatedSettings)); // update here, to take effect immediately
      return updatedSettings;
    });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        updateState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within a AppStateProvider");
  }
  return context;
}
