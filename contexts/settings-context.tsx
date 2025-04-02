"use client";

import type React from "react";

import { createContext, useContext, useState } from "react";

export interface UserSettings {
  loggedIn: boolean;
  accessToken?: string;
  zkLogin: {
    isEnabled: boolean;
    idToken?: string;
    secretKey?: string;
    randomness?: string;
    maxEpoch?: number;
    zkp?: string;
    address?: string;
  };
  playground?: {
    systemPrompt?: string;
    customSystemPrompt?: string;
    outputLength?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    repetitionPenalty?: number;
  };
}

const defaultSettings: UserSettings = {
  loggedIn: false,
  zkLogin: {
    isEnabled: false,
  },
  playground: {
    systemPrompt: "Default",
    customSystemPrompt: "",
    outputLength: 2048,
    temperature: 0.7,
    topP: 0.7,
    topK: 50,
    repetitionPenalty: 1,
  },
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  updateZkLoginSettings: (newSettings: Partial<UserSettings["zkLogin"]>) => void;
  updatePlaygroundSettings: (newSettings: Partial<UserSettings["playground"]>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    // Try to load settings from sessionStorage during initialization
    if (typeof window !== "undefined") {
      const savedSettings = sessionStorage.getItem("userSettings");
      if (savedSettings) {
        return { ...defaultSettings, ...JSON.parse(savedSettings) };
      }
    }
    return defaultSettings;
  });

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => {
      const updatedSettings = { ...prev, ...newSettings };
      sessionStorage.setItem("userSettings", JSON.stringify(updatedSettings)); // update here, to take effect immediately
      return updatedSettings;
    });
  };

  const updateZkLoginSettings = (zkLoginSettings: Partial<UserSettings["zkLogin"]>) => {
    setSettings(prev => {
      const updatedSettings = {
        ...prev,
        zkLogin: { ...prev.zkLogin, ...zkLoginSettings },
      };
      sessionStorage.setItem("userSettings", JSON.stringify(updatedSettings)); // update here, to take effect immediately
      return updatedSettings;
    });
  };

  const updatePlaygroundSettings = (playgroundSettings: Partial<UserSettings["playground"]>) => {
    setSettings(prev => {
      const updatedSettings = {
        ...prev,
        playground: { ...prev.playground, ...playgroundSettings },
      };
      sessionStorage.setItem("userSettings", JSON.stringify(updatedSettings));
      return updatedSettings;
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateZkLoginSettings,
        updatePlaygroundSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
