"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, Activity, Box, Cpu, Clock, ArrowUpRight } from "lucide-react";
import React from "react";
import { formatNumber } from "@/lib/utils";
import {
  getComputeUnitsProcessed,
  getLatency,
  getNodesDistribution,
  getStats,
  getSubscriptions,
  getTasks,
  type Stats,
} from "@/lib/api";

export function MetricsCards() {
  const [metricsData, setMetricsData] = React.useState({
    totalNodes: "-",
    nodesOnline: "-",
    models: "-",
    tokens: "-",
    latency: "-",
    throughPut: "-",
  });

  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const tasksPromise = getTasks();
        const nodesPromise = getNodesDistribution();
        const statsPromise = getStats();
        const subscriptionsPromise = getSubscriptions();
        const computeUnitsPromise = getComputeUnitsProcessed();

        const [tasksRes, nodesRes, statsRes, subscriptionsRes, computeUnitsRes] = await Promise.all([
          tasksPromise,
          nodesPromise,
          statsPromise,
          subscriptionsPromise,
          computeUnitsPromise,
        ]);

        // Total nodes
        const totalNodes =
          nodesRes.data?.reduce((sum: number, node: { count: number }) => sum + (+node.count || 0), 0) || 0;

        // Nodes online
        const nodesOnline = new Set<number>(
          subscriptionsRes?.data
            ?.filter(({ valid }: { valid: boolean }) => valid)
            .map(({ node_small_id }: { node_small_id: number }) => node_small_id)
        ).size;

        // Models
        const modelCount = new Set<string>(tasksRes.data.map(([task, _]) => task.model_name!)).size;

        // Tokens
        const totalComputeUnits = computeUnitsRes?.data.reduce(
          (acc: any, item: any) => {
            acc.totalUnits += item.amount;
            acc.totalRequests += item.requests;
            acc.totalTime += item.time;
            return acc;
          },
          { totalUnits: 0, totalRequests: 0, totalTime: 0 }
        );

        // Throughput
        const averageThroughPut = totalComputeUnits?.totalRequests / (totalComputeUnits?.totalTime / 3600); // The totalTime is in seconds

        const getStatsValue = (stats: Stats[], name: string) => {
          const latency = stats.find(dashboard => dashboard.title === name)?.panels?.[0]?.data?.results?.A?.frames?.[0];
          const valueIndex = latency?.schema?.fields?.findIndex((field: any) => field.name === "Value");
          return latency?.data?.values?.[valueIndex]?.[0];
        };

        const latency = getStatsValue(statsRes.data, "Performance");

        setMetricsData(prevData => ({
          totalNodes: formatNumber(totalNodes),
          nodesOnline: formatNumber(nodesOnline),
          models: formatNumber(modelCount),
          tokens: formatNumber(totalComputeUnits?.totalUnits),
          latency: (isFinite(latency) ? latency.toFixed(2) : "-") + "ms",
          throughPut: isFinite(averageThroughPut) ? formatNumber(averageThroughPut) : "-",
        }));
      } catch (err) {
        console.error("Failed to fetch metrics", err);
      }
    };

    fetchMetrics();
  }, []);

  const metrics = [
    {
      title: "Total Nodes",
      value: metricsData.totalNodes,
      description: "Across all networks",
      icon: Network,
      color: "text-primary",
      textColor: "text-primary",
    },
    {
      title: "Nodes Online",
      value: metricsData.nodesOnline,
      description: "Currently active",
      icon: Activity,
      color: "text-primary",
      textColor: "text-primary",
    },
    {
      title: "Models",
      value: metricsData.models,
      description: "Different models available",
      icon: Box,
      color: "text-primary",
      textColor: "text-primary",
    },
    {
      title: "Tokens",
      value: metricsData.tokens,
      description: "Processed on Atoma",
      icon: Cpu,
      color: "text-primary",
      textColor: "text-primary",
    },
    {
      title: "Performance",
      value: metricsData.latency,
      description: "Past week",
      icon: Clock,
      color: "text-primary",
      textColor: "text-primary",
    },
    {
      title: "Throughput",
      value: metricsData.throughPut,
      description: "Requests/hour",
      icon: ArrowUpRight,
      color: "text-primary",
      textColor: "text-primary",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
      {metrics.map(metric => (
        <Card key={metric.title} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metric.textColor}`}>{metric.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
