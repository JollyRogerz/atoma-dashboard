"use client";

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { MetricsCards } from "@/components/analytics/metrics-cards";
import { useEffect, useState } from "react";
import { getGraphData, getGraphs, getSubscriptions, getTasks } from "@/lib/api";
import LoadingCircle from "@/components/LoadingCircle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider, TooltipTrigger, TooltipContent, Tooltip as ShadTooltip } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useTheme } from "next-themes";
import type { NodeSubscription } from "@/lib/atoma";
import { readableModelName } from "@/utils/utils";

// Colors for different chart types
const colors = {
  light: {
    blue: "#BAE6FD",
    green: "#D1FAE5",
    yellow: "#FFF3C9",
    red: "#FFC9C9",
    purple: "#E9D5FF",
  },
  lightText: {
    // Add this new object for tooltip text colors
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

function AreaPanel({
  series,
  tickFormatter,
  timeFilter,
  valueFormatter,
  labelsArray,
  fillOpacity,
  stackingGroup,
}: {
  series: {
    time: string;
    data: Record<string, string>;
  }[];
  tickFormatter: (value: string) => string;
  timeFilter: (date: Date) => boolean;
  valueFormatter: (value: number) => string;
  labelsArray: string[];
  fillOpacity?: number;
  stackingGroup?: string;
}) {
  const wholeHourTicks = series.map(({ time }) => time).filter(timeStr => timeFilter(new Date(timeStr)));
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
              return {
                ...entry,
                color: currentTheme === "dark" ? colors.darkText[colorKey] : colors.lightText[colorKey],
              };
            });

            // Helper function to get consistent color mapping
            function getColorKeyForModel(modelName: string, fallbackIndex: number): keyof typeof colors.lightText {
              if (modelName.includes("Qwen2")) return "blue";
              if (modelName.includes("DeepSeek")) return "green";
              if (modelName.includes("QWQ")) return "yellow";
              if (modelName.includes("Llama")) return "purple";
              if (modelName.includes("Claude")) return "red";

              // Fallback to index-based
              const colorKeys: (keyof typeof colors.lightText)[] = ["blue", "green", "yellow", "red", "purple"];
              return colorKeys[fallbackIndex % colorKeys.length];
            }

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

function BarGaugePanel({
  series,
  tickFormatter,
  timeFilter,
  valueFormatter,
  labelsArray,
  fillOpacity,
  stackingGroup,
}: {
  series: {
    time: string;
    data: Record<string, string>;
  }[];
  tickFormatter: (value: string) => string;
  timeFilter: (date: Date) => boolean;
  valueFormatter: (value: number) => string;
  labelsArray: string[];
  fillOpacity?: number;
  stackingGroup?: string;
}) {
  const barData = labelsArray.map(label => ({
    name: label,
    Tokens: Number(series[series.length - 1].data[label] || 0),
  }));

  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState(theme);

  useEffect(() => {
    setCurrentTheme(theme);
  }, [theme]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
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
          tickFormatter={valueFormatter}
        />
        <YAxis
          dataKey="name"
          type="category"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#888888", fontSize: 12 }}
          tickFormatter={readableModelName}
        />
        <Tooltip
          content={props => {
            const { payload, label } = props;

            // Get color based on model name
            const modelName = label || "";
            const colorKey = getColorKeyForModel(modelName, labelsArray.indexOf(label));
            const textColor = currentTheme === "dark" ? colors.darkText[colorKey] : colors.lightText[colorKey];

            // Helper function to get consistent color mapping
            function getColorKeyForModel(modelName: string, fallbackIndex: number): keyof typeof colors.lightText {
              if (modelName.includes("Qwen2")) return "blue";
              if (modelName.includes("DeepSeek")) return "green";
              if (modelName.includes("QWQ")) return "yellow";
              if (modelName.includes("Llama")) return "purple";
              if (modelName.includes("Claude")) return "red";

              // Fallback to index-based
              const colorKeys: (keyof typeof colors.lightText)[] = ["blue", "green", "yellow", "red", "purple"];
              return colorKeys[fallbackIndex % colorKeys.length];
            }

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
                }}
              >
                <div>{readableModelName(label)}</div>
                <div
                  key={`${payload?.[0]?.name}-value`}
                  style={{
                    color: textColor,
                    fontWeight: "bold",
                    display: "block",
                    padding: "2px 0",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: `<span style="color:${textColor} !important;">${payload?.[0]?.name}: ${valueFormatter(Number(payload?.[0]?.value))}</span>`,
                  }}
                ></div>
              </div>
            );
          }}
        />
        <Bar dataKey="Tokens" radius={[0, 4, 4, 0]} barSize={20}>
          {barData.map((entry, index) => {
            const colorKey = getColorKeyForModel(entry.name, index);
            const barColor = currentTheme === "dark" ? colors.dark[colorKey] : colors.light[colorKey];
            return <Cell key={`cell-${index}`} fill={barColor} fillOpacity={0.6} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function PanelData({
  data,
  fieldConfig,
  timeFilter,
  tickFormatter,
  type,
  activeModels,
}: {
  data: any;
  fieldConfig: any;
  timeFilter: (date: Date) => boolean;
  tickFormatter: (value: string) => string;
  type: string;
  activeModels: string[];
}) {
  const unit = fieldConfig?.defaults?.unit;
  const valueFormatter = (value: number) => `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;
  const graphData: Record<number, Record<string, string>> = {};
  const stackingGroup =
    fieldConfig?.defaults?.custom?.stacking?.mode != "none" && fieldConfig?.defaults?.custom?.stacking?.group;
  const fillOpacity = fieldConfig?.defaults?.custom?.fillOpacity;
  let labels: Set<string> = new Set();
  Object.keys(data["results"]).forEach(ref => {
    data["results"][ref]["frames"].forEach((frame: any) => {
      const timeId = frame.schema.fields.findIndex((field: any) => field.type === "time");
      const schema = frame.schema.fields.map((field: any) => {
        return field.type == "time"
          ? "time"
          : field?.config?.displayNameFromDS || Object.values(field?.labels)?.[0] || field.name;
      });
      // We check if this frame has model and if so, is it active?
      const use = frame.schema.fields.every((field: any) =>
        field?.labels?.model ? activeModels.includes(field?.labels?.model) : true
      );
      if (use) {
        labels = new Set([...labels, ...schema.filter((_: any, index: number) => index !== timeId)]);
        if (frame.data.values.length === 0) {
          return;
        }
        for (let i = 0; i < frame.data.values[0].length; i++) {
          const time = new Date(frame.data.values[timeId][i]).getTime();
          if (!(time in graphData)) {
            graphData[time] = {};
          }
          for (let j = 0; j < frame.data.values.length; ++j) {
            if (j == timeId) {
              continue;
            }
            graphData[time][schema[j]] = frame.data.values[j][i];
          }
        }
      }
    });
  });
  const series = Object.entries(graphData)
    .sort()
    .map(([time, value]) => {
      return {
        time: new Date(Number(time)).toLocaleString(),
        data: value,
      };
    });
  if (Object.keys(graphData).length === 0) {
    return <div className="flex justify-center items-center h-2/3">No data available</div>;
  }

  const labelsArray = Array.from(labels).sort();
  switch (type) {
    case "timeseries":
      return (
        <AreaPanel
          series={series}
          tickFormatter={tickFormatter}
          timeFilter={timeFilter}
          valueFormatter={valueFormatter}
          labelsArray={labelsArray}
          fillOpacity={fillOpacity}
          stackingGroup={stackingGroup}
        />
      );
    case "bargauge":
      return (
        <BarGaugePanel
          series={series}
          tickFormatter={tickFormatter}
          timeFilter={timeFilter}
          valueFormatter={valueFormatter}
          labelsArray={labelsArray}
          fillOpacity={fillOpacity}
          stackingGroup={stackingGroup}
        />
      );
    default:
      return null;
  }
}

function Panel({
  title,
  description,
  fieldConfig,
  type,
  data,
  timeFilter,
  tickFormatter,
  activeModels,
}: {
  title: string;
  description?: string;
  fieldConfig: any;
  type: string;
  data: any;
  timeFilter: (date: Date) => boolean;
  tickFormatter: (value: string) => string;
  activeModels: string[];
}) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-full">
        {description && (
          <TooltipProvider>
            <ShadTooltip>
              <TooltipTrigger asChild>
                <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-500">
                  <Info className="h-4 w-4" />
                  <span className="sr-only">Information</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-foreground/90 dark:text-foreground/90 font-medium">{description}</p>
              </TooltipContent>
            </ShadTooltip>
          </TooltipProvider>
        )}
        {data ? (
          <PanelData
            data={data.data}
            type={type}
            fieldConfig={fieldConfig}
            timeFilter={timeFilter}
            tickFormatter={tickFormatter}
            activeModels={activeModels}
          />
        ) : (
          <div className="flex justify-center items-center">
            <LoadingCircle isSpinning={true} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Dashboard({
  title,
  panels,
  activeModels,
}: {
  title: string;
  panels: { title: string; description?: string; fieldConfig: any; data: any; type: string; query: { from: string } }[];
  activeModels: string[];
}) {
  return (
    <>
      {panels.map(({ title, description, fieldConfig, data, query, type }) => {
        const from: string = query["from"];
        const regex = /now-(\d+)([dmh])/;
        const match = from.match(regex);
        const range = match ? parseInt(match[1], 10) : null;
        const timeUnit = match ? match[2] : null;
        const timeFilter = (timestamp: Date) => {
          if (!range || !timeUnit) return true;
          const unixTimestamp = timestamp.getTime() / 1000;
          switch (timeUnit) {
            case "d":
              return unixTimestamp % (60 * 60 * 24) === 0;
            case "h":
              return unixTimestamp % (60 * 60) === 0;
            case "m":
              return unixTimestamp % 60 === 0;
            default:
              return true;
          }
        };
        const tickFormatter = (value: string) => {
          if (!range || !timeUnit) return new Date(value).toLocaleString();
          const date = new Date(value);
          switch (timeUnit) {
            case "d":
              return date.toLocaleDateString(undefined, { weekday: "short" });
            default:
              return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
          }
        };
        return (
          <Panel
            key={title}
            title={title}
            description={description}
            fieldConfig={fieldConfig}
            data={data}
            type={type}
            timeFilter={timeFilter}
            tickFormatter={tickFormatter}
            activeModels={activeModels}
          />
        );
      })}
    </>
  );
}

export default function NetworkStatusPage() {
  const [graphs, setGraphs] = useState<
    | {
        title: string;
        panels: { title: string; description?: string; fieldConfig: any; query: any; data: any; type: string }[];
      }[]
    | null
  >(null);
  const [models, setModels] = useState<string[]>([]);
  const { theme } = useTheme();

  useEffect(() => {
    (async () => {
      const tasksPromise = getTasks();
      const subscriptionsPromise = getSubscriptions();

      const [tasksRes, subscriptionsRes] = await Promise.all([tasksPromise, subscriptionsPromise]);
      const tasks = tasksRes?.data.map(([task, modality]) => ({
        task: task,
        modality: modality,
      }));

      for (const { task, modality } of tasks) {
        const subs_for_this_task = subscriptionsRes?.data.filter(
          (subscription: NodeSubscription) => subscription.task_small_id === task.task_small_id && subscription.valid
        );
        if (subs_for_this_task.length === 0) {
          // No valid subscriptions for this task
          continue;
        }
        setModels(models => [...models, task.model_name!]);
      }
      let graphs = await getGraphs();
      setGraphs(
        graphs.data.map(({ title, panels }) => ({
          title: title,
          panels: panels.map(({ title, description, field_config, query, type }) => ({
            title,
            description,
            query,
            fieldConfig: field_config,
            data: null,
            type,
          })),
        }))
      );
      graphs.data.forEach(({ title, panels }, dashboardIndex) => {
        panels.forEach(async ({ query, interval }, panelIndex) => {
          query.queries.forEach((q: any) => {
            q.interval = interval;
          });
          let panelData = await getGraphData(query);
          setGraphs(graphs => {
            const updatedGraphs = [...graphs!];
            updatedGraphs[dashboardIndex].panels[panelIndex].data = panelData;
            return updatedGraphs;
          });
        });
      });
    })();
  }, []);

  return (
    <div className="relative min-h-screen w-full">
      {/* Content */}
      <div className="relative z-10">
        <div className="space-y-4 p-6">
          <MetricsCards />
          {graphs && graphs.every(graph => graph.panels.every(panel => panel.data)) ? (
            <div className="grid md:grid-cols-2 gap-6">
              {graphs.map(({ title, panels }) => (
                <Dashboard key={title} title={title} panels={panels} activeModels={models} />
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center pt-5">
              <LoadingCircle isSpinning={true} size="lg" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}