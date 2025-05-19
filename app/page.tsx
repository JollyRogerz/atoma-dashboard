"use client";

// import dynamic from 'next/dynamic'; // Remove if only used for chart panels
// Recharts imports were already removed, which is correct if panels handle their own.
import { MetricsCards } from "@/components/analytics/metrics-cards";
import { useEffect, useState } from "react";
import { getGraphData, getGraphs, getSubscriptions, getTasks } from "@/lib/api";
import LoadingCircle from "@/components/LoadingCircle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider, TooltipTrigger, TooltipContent, Tooltip as ShadTooltip } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useTheme } from "next-themes";
import type { NodeSubscription } from "@/lib/atoma-types";
import { readableModelName } from "@/utils/utils";
import React from "react";

// Statically import the chart panels for diagnostics
import AreaPanel from "@/components/charts/AreaPanel";
import BarGaugePanel from "@/components/charts/BarGaugePanel";

// Remove the dynamic import definitions for DynamicAreaPanel and DynamicBarGaugePanel
// const DynamicAreaPanel = ...
// const DynamicBarGaugePanel = ...

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
  tickFormatter: (value: number) => string;
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
        time: Number(time),
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
        <AreaPanel // Use static import
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
        <BarGaugePanel // Use static import
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

const Panel = React.memo(
  ({
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
    tickFormatter: (value: number) => string;
    activeModels: string[];
  }) => {
    // If timeFilter or tickFormatter are re-created on every render of Dashboard,
    // React.memo on Panel won't be effective unless these are memoized with useCallback in Dashboard.
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
              data={data}
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
);
Panel.displayName = "Panel";

const Dashboard = React.memo(
  ({
    title,
    panels,
    activeModels,
  }: {
    title: string;
    panels: { title: string; description?: string; fieldConfig: any; from: string; data: any; type: string }[];
    activeModels: string[];
  }) => {
    return (
      <>
        {panels.map(({ title: panelTitle, description, fieldConfig, data, from, type }) => {
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
          const tickFormatter = (value: number) => {
            const date = new Date(value);
            if (!range || !timeUnit) return date.toLocaleString();

            switch (timeUnit) {
              case "d":
                return date.toLocaleDateString(undefined, { weekday: "short" });
              default:
                return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
            }
          };
          return (
            <Panel
              key={panelTitle}
              title={panelTitle}
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
);
Dashboard.displayName = "Dashboard";

export default function NetworkStatusPage() {
  const [graphs, setGraphs] = useState<
    | {
        title: string;
        panels: { title: string; description?: string; fieldConfig: any; from: string; data: any; type: string }[];
      }[]
    | null
  >(null);
  const { theme } = useTheme();

  useEffect(() => {
    (async () => {
      try {
        const tasksPromise = getTasks();
        const subscriptionsPromise = getSubscriptions();

        const [tasksRes, subscriptionsRes] = await Promise.all([tasksPromise, subscriptionsPromise]);
        const tasks = tasksRes?.data.map(([task, modality]) => ({
          task: task,
          modality: modality,
        }));

        const activeModelsFromEffect: string[] = [];
        if (tasks && subscriptionsRes?.data) {
          for (const { task, modality } of tasks) {
            const subs_for_this_task = subscriptionsRes.data.filter(
              (subscription: NodeSubscription) =>
                subscription.task_small_id === task.task_small_id && subscription.valid
            );
            if (subs_for_this_task.length === 0) {
              continue;
            }
            activeModelsFromEffect.push(task.model_name!);
          }
        }
        setModels(activeModelsFromEffect);

        const graphs = await getGraphs();
        setGraphs(
          graphs.data.map(({ title, panels }) => ({
            title: title,
            panels: panels.map(({ title: panelTitle, description, field_config, from, type, data }) => ({
              title: panelTitle,
              description,
              from,
              fieldConfig: field_config,
              data,
              type,
            })),
          }))
        );
      } catch (error) {
        console.error("Failed to fetch initial page data:", error);
        setGraphs(null);
      }
    })();
  }, []);


  return (
    <div className="relative min-h-screen w-full">
      {/* Content */}
      <div className="relative z-10">
        <div className="space-y-4 p-6">
          <MetricsCards />
          {graphs ? (
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
