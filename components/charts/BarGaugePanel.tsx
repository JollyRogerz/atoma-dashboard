"use client";

import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { readableModelName } from "@/utils/utils"; // Assuming this is the correct path
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

// Props type for BarGaugePanel - ensure it matches the one in app/page.tsx
interface BarGaugePanelProps {
  series: {
    time: number; // Or string, ensure consistency with what PanelData provides
    data: Record<string, string>;
  }[];
  tickFormatter: (value: number) => string; // Or string, ensure consistency
  timeFilter: (date: Date) => boolean;
  valueFormatter: (value: number) => string;
  labelsArray: string[];
  fillOpacity?: number;
  stackingGroup?: string; // Though likely not used by BarGauge
}

export default function BarGaugePanel({
  series,
  tickFormatter, // Note: tickFormatter from PanelData is for time, BarGaugePanel uses valueFormatter for its XAxis numerical ticks
  timeFilter, // Not directly used by BarGaugePanel's rendering logic usually
  valueFormatter,
  labelsArray,
  fillOpacity, // Potentially used for Cell opacity if desired, or Bar fillOpacity
  stackingGroup, // Likely not applicable to this BarGauge chart type
}: BarGaugePanelProps) {
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState(theme);

  const barData = React.useMemo(() => {
    return labelsArray
      .map(label => ({
        name: label,
        Tokens: Number(series[series.length - 1]?.data[label] || 0),
        displayName: readableModelName(label),
      }))
      .sort((a, b) => b.Tokens - a.Tokens);
  }, [labelsArray, series]);

  useEffect(() => {
    setCurrentTheme(theme);
  }, [theme]);

  const TickRenderer = React.memo(({ x, y, payload }: any) => {
    const originalEntry = barData.find(item => item.name === payload.value);
    const simpleName = originalEntry?.displayName || readableModelName(payload.value);
    return (
      <g transform={`translate(${x},${y})`}>
        <title>{payload.value}</title>
        <text x={0} y={0} dy={4} textAnchor="end" fill="#888888" fontSize={11} style={{ cursor: "pointer" }}>
          {simpleName}
        </text>
      </g>
    );
  });
  TickRenderer.displayName = "YAxisTickRenderer";

  const renderTooltip = React.useCallback(
    (props: any) => {
      const { payload, label } = props;
      if (!payload || !payload.length) return null;

      const modelName = label || "";
      const modelEntry = barData.find(item => item.name === modelName);
      const displayName = modelEntry?.displayName || readableModelName(modelName);

      const colorKey = getColorKeyForModel(modelName, labelsArray.indexOf(label));
      const textColor = currentTheme === "dark" ? colors.darkText[colorKey] : colors.lightText[colorKey];

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
          <div>{displayName}</div>
          <div className="text-xs text-muted-foreground mt-1">{modelName}</div>
          <div
            style={{
              fontWeight: "bold",
              display: "block",
              padding: "2px 0",
              marginTop: "4px",
            }}
            dangerouslySetInnerHTML={{
              __html: `<span style="color:${textColor} !important;">${payload[0]?.name}: ${valueFormatter(Number(payload[0]?.value))}</span>`,
            }}
          />
        </div>
      );
    },
    [barData, currentTheme, labelsArray, valueFormatter]
  );

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
        <CartesianGrid
          horizontal={true}
          vertical={false}
          stroke="hsl(var(--border))"
          strokeDasharray="4 4"
          strokeWidth={1}
          opacity={0.6}
        />
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#888888", fontSize: 12 }}
          tickFormatter={valueFormatter} // Uses valueFormatter for numerical XAxis
        />
        <YAxis
          dataKey="name"
          type="category"
          axisLine={false}
          tickLine={false}
          width={120}
          tick={props => <TickRenderer {...props} />}
        />
        <Tooltip content={renderTooltip} />
        <Bar dataKey="Tokens" radius={[0, 4, 4, 0]} barSize={20}>
          {barData.map((entry, index) => {
            const colorKey = getColorKeyForModel(entry.name, index);
            const barColor = currentTheme === "dark" ? colors.dark[colorKey] : colors.light[colorKey];
            // Use fillOpacity prop for Cell if provided, otherwise default (e.g., 0.6 or 1)
            const cellFillOpacity = fillOpacity !== undefined ? fillOpacity / 100 : 0.6;
            return <Cell key={`cell-${index}`} fill={barColor} fillOpacity={cellFillOpacity} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
