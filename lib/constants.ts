export const colors = {
  light: {
    blue: "#BAE6FD",
    green: "#D1FAE5",
    yellow: "#FFF3C9",
    red: "#FFC9C9",
    purple: "#E9D5FF", // Reverted back to purple
  },
  lightText: {
    // Add this new object for tooltip text colors
    blue: "#2563eb",
    green: "#059669",
    yellow: "#b45309",
    red: "#dc2626",
    purple: "#7c3aed",
  },
  dark: {
    blue: "#1e3a8a",
    green: "#064e3b",
    yellow: "#713f12",
    red: "#7f1d1d",
    purple: "#581c87", // Reverted back to dark purple
  },
} as const;

export const chartDefaults = {
  margin: { top: 0, right: 0, left: 0, bottom: 0 },
  height: 250,
  axisStyle: {
    axisLine: false,
    tickLine: false,
    tick: { fill: "#888888", fontSize: 12 },
  },
  tooltipStyle: {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    fontWeight: "bold",
    color: "var(--card-foreground)",
  },
} as const; 
