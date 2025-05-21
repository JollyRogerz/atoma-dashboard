"use client";

import { ResponsiveContainer, XAxis, YAxis, Area, AreaChart, Tooltip, CartesianGrid } from "recharts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { readableModelName } from "@/utils/utils"; // Assuming this is the correct path from components/charts
import React from "react";

// Colors for different chart types (copied from app/page.tsx)
const colors = {
  light: {
    blue: "#BAE6FD",
    green: "#D1FAE5",
    yellow: "#FFF3C9",
    red: "#FFC9C9",
    purple: "#E9D5FF",
  },
  lightText: {
    blue: "#2563eb",
    green: "#059669",
    yellow: "#b45309",
    red: "#dc2626",
    purple: "#7c3aed",
  },
  darkText: {
    blue: "#1e3a8a",
    green: "#064e3b",
    yellow: "#713f12",
    red: "#7f1d1d",
    purple: "#581c87",
    purpleReadable: "#A78BFA", // Adjusted readable purple
    greenReadable: "#6EE7B7", // Adjusted readable green
  },
  dark: {
    blue: "#1e3a8a",
    green: "#064e3b",
    yellow: "#713f12",
    red: "#7f1d1d",
    purple: "#581c87",
  },
};

// Helper function to get consistent color mapping (copied from app/page.tsx)
function getColorKeyForModel(modelName: string, fallbackIndex: number): keyof typeof colors.lightText {
  if (modelName.includes("Qwen2")) return "blue";
  if (modelName.includes("DeepSeek")) return "green";
  if (modelName.includes("Mistral-Nemo")) return "yellow";
  if (modelName.includes("QWQ")) return "yellow";
  if (modelName.includes("Llama")) return "purple";
  if (modelName.includes("Claude")) return "red";

  const colorKeys: (keyof typeof colors.lightText)[] = ["blue", "green", "yellow", "red", "purple"];
  return colorKeys[fallbackIndex % colorKeys.length];
}

// Props type for AreaPanel - ensure it matches the one in app/page.tsx
interface AreaPanelProps {
  series: {
    time: number;
    data: Record<string, string>;
  }[];
  tickFormatter: (value: number) => string;
  timeFilter: (date: Date) => boolean;
  valueFormatter: (value: number) => string;
  labelsArray: string[];
  fillOpacity?: number;
  stackingGroup?: string;
}

export default function AreaPanel({
  series,
  tickFormatter,
  timeFilter,
  valueFormatter,
  labelsArray,
  fillOpacity,
  stackingGroup,
}: AreaPanelProps) {
  const wholeHourTicks = series.map(({ time }) => time).filter(time => timeFilter(new Date(time)));
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState(theme);

  useEffect(() => {
    setCurrentTheme(theme);
  }, [theme]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={series} margin={{ top: 0, right: 0, bottom: 0 }}>
        <CartesianGrid
          horizontal={true}
          vertical={false}
          stroke="hsl(var(--border))"
          strokeDasharray="2 2"
          strokeWidth={0.5}
          opacity={0.2}
        />
        <XAxis
          dataKey="time"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#888888", fontSize: 12 }}
          tickFormatter={tickFormatter}
          ticks={wholeHourTicks}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#888888", fontSize: 12 }}
          width={80}
          tickFormatter={valueFormatter}
        />
        <Tooltip
          content={props => {
            const { payload, label } = props;
            const combinedPayload = payload?.map((entry, index) => {
              const modelName = entry.name?.toString() || "";
              const colorKey = getColorKeyForModel(modelName, index);
              let entryColor = currentTheme === "dark" ? colors.darkText[colorKey] : colors.lightText[colorKey];

              // Override for Llama in dark mode for better readability
              if (currentTheme === "dark" && colorKey === "purple") {
                entryColor = colors.darkText.purpleReadable;
              }
              // Override for DeepSeek in dark mode for better readability
              if (currentTheme === "dark" && colorKey === "green") {
                entryColor = colors.darkText.greenReadable;
              }

              return {
                ...entry,
                color: entryColor,
              };
            });

            if (stackingGroup) {
              combinedPayload?.reverse();
            } else {
              combinedPayload?.sort((a, b) => Number(b.value) - Number(a.value));
            }
            const formattedLabel = new Date(label).toLocaleDateString();
            return (
              <div
                style={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  fontWeight: "bold",
                  color: "var(--card-foreground)",
                  padding: "8px",
                  maxWidth: "300px",
                }}
              >
                <div>{formattedLabel}</div>

                {combinedPayload?.map((entry, index) => {
                  return (
                    <div key={index}>
                      <span
                        style={{
                          color: entry.color,
                          fontWeight: "bold",
                          display: "inline-block",
                          padding: "2px 0",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: `<span style="color:${entry.color} !important;">${readableModelName(entry.name!.toString())}: ${valueFormatter(Number(entry.value))}</span>`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          }}
        />
        {labelsArray.map((label, index) => {
          const colorKey = getColorKeyForModel(label, index);
          const color = currentTheme === "dark" ? colors.dark[colorKey] : colors.light[colorKey];
          return (
            <Area
              key={index}
              name={label}
              type="monotone"
              dataKey={data => data.data[label] || 0}
              stroke={color}
              strokeWidth={2}
              fill={color}
              fillOpacity={fillOpacity ? fillOpacity / 100 : 0}
              stackId={stackingGroup}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}
