import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getAllStacks, getAllTasks } from "@/lib/api";
import { useToast } from "@/app/toast-provider";
import LoadingCircle from "../LoadingCircle";
import { useSettings } from "@/contexts/settings-context";

const usageData = [
  {
    date: "January 6, 2025",
    model: "Unknown",
    tokens: "2,560,000",
    cost: "$7.68",
  },
  {
    date: "January 7, 2025",
    model: "meta-llama/Llama-3.3-70B-Instruct",
    tokens: "2,560,000",
    cost: "$0.10",
  },
  {
    date: "February 16, 2025",
    model: "Unknown",
    tokens: "3,365",
    cost: "$0.00",
  },
  {
    date: "January 11, 2025",
    model: "meta-llama/Llama-3.3-70B-Instruct",
    tokens: "2,559,964",
    cost: "$1.54",
  },
  {
    date: "January 11, 2025",
    model: "meta-llama/Llama-3.3-70B-Instruct",
    tokens: "2,559,989",
    cost: "$1.54",
  },
  {
    date: "January 27, 2025",
    model: "intfloat/multilingual-e5-large-instruct",
    tokens: "28",
    cost: "$0.00",
  },
  {
    date: "January 11, 2025",
    model: "meta-llama/Llama-3.3-70B-Instruct",
    tokens: "2,559,931",
    cost: "$1.54",
  },
  {
    date: "February 4, 2025",
    model: "black-forest-labs/FLUX.1-schnell",
    tokens: "0",
    cost: "$0.00",
  },
];

interface IUsageHistory {
  id: string;
  date: string;
  tokens: number;
  used_tokens: number;
  cost: number;
  model: string;
}

export function UsageHistory() {
  const [usageHistory, setUsageHistory] = useState<IUsageHistory[] | null>(null);
  const { showToast } = useToast();
  const { settings } = useSettings();
  useEffect(() => {
    if (!settings.loggedIn) {
      setUsageHistory([]);
      return;
    }
    setUsageHistory(null);
    (async () => {
      let stacksPromise = await getAllStacks().catch(ex => {
        showToast("Error occurred", "error");
        return { data: [] };
      });
      let tasksPromise = getAllTasks().catch(ex => {
        showToast("Error occurred", "error");
        return { data: [] };
      });
      let [stacks, tasks] = await Promise.all([stacksPromise, tasksPromise]);
      setUsageHistory(
        stacks.data
          .sort(([, timestamp0], [, timestamp1]) => (timestamp0 < timestamp1 ? 1 : timestamp0 > timestamp1 ? -1 : 0))
          .map(([stack, timestamp]) => {
            return {
              id: stack.stack_id,
              date: new Date(timestamp).toLocaleDateString(),
              tokens: stack.num_compute_units,
              used_tokens: stack.already_computed_units,
              cost: (stack.num_compute_units / 1000000) * (stack.price_per_one_million_compute_units / 1000000),
              model:
                tasks.data.find(task => task[0].task_small_id === stack.task_small_id)?.[0].model_name || "Unknown",
            };
          })
      );
    })();
  }, [settings.loggedIn]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Usage History</CardTitle>
      </CardHeader>
      <CardContent>
        {usageHistory ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageHistory.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell className="font-mono text-sm">{row.model}</TableCell>
                  <TableCell className="text-right">{row.tokens}</TableCell>
                  <TableCell className="text-right">{row.cost}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex justify-center">
            <LoadingCircle isSpinning={true} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
