"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiUsageDialog } from "@/components/api-usage-dialog";
import Link from "next/link";
import { getSubscriptions, getTasks } from "@/lib/api";
import { modalityToFeatureName, simplifyModelName } from "@/lib/utils";
import { ModelModality, NodeSubscription, Task } from "@/lib/atoma";
import { Lock, Unlock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModelSection {
  type: ModelModality;
  title: string;
  models: {
    name: string;
    price: string;
    modalities: ModelModality[];
  }[];
}

const ModalityToCategory = {
  [ModelModality.ChatCompletions]: "chat",
  [ModelModality.ImagesGenerations]: "image",
  [ModelModality.Embeddings]: "embedding",
};

function ModelCard({ name, price, modalities, isConfidential }: { name: string; price: string; modalities: ModelModality[]; isConfidential: boolean }) {
  const [showApiDialog, setShowApiDialog] = useState(false);

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-base font-medium">{simplifyModelName(name)}</h3>
              <p className="text-sm text-muted-foreground">${price} per 1M tokens</p>
            </div>
            <div className="flex items-center gap-2">
              {isConfidential && (
                <span className="inline-flex items-center rounded-md bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-500 ring-1 ring-inset ring-orange-500/20">
                  <Lock className="h-3 w-3 mr-1" />
                  Confidential
                </span>
              )}
              {modalities.map(modality => (
                <span
                  className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20"
                  key={modality}
                >
                  {ModalityToCategory[modality]}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/playground" className="w-full">
              <Button variant="outline" className="w-full">
                Playground
              </Button>
            </Link>
            <Button variant="outline" className="w-full" onClick={() => setShowApiDialog(true)}>
              API
            </Button>
          </div>
        </CardContent>
      </Card>
      <ApiUsageDialog 
        isOpen={showApiDialog} 
        onClose={() => setShowApiDialog(false)} 
        modelName={name} 
        modality={modalities[0]}
        isConfidential={isConfidential}
      />
    </>
  );
}

export default function ModelsPage() {
  const [selectedCategory, setSelectedCategory] = useState<ModelModality>(ModelModality.ChatCompletions);
  const [isConfidentialMode, setIsConfidentialMode] = useState(false);
  const [modelsData, setModelsData] = useState<
    Record<
      ModelModality,
      {
        name: string;
        price: string;
        modalities: ModelModality[];
      }[]
    >
  >({
    [ModelModality.ChatCompletions]: [],
    [ModelModality.ImagesGenerations]: [],
    [ModelModality.Embeddings]: [],
  });

  useEffect(() => {
    (async () => {
      try {
        const tasksPromise = getTasks();
        const subscriptionsPromise = getSubscriptions();

        const [tasksRes, subscriptionsRes] = await Promise.all([tasksPromise, subscriptionsPromise]);
        const cheapestSubscription = new Map<string, NodeSubscription>();
        const modelModalities = new Map<string, ModelModality[]>();
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
          modelModalities.set(task.model_name!, modality);
          cheapestSubscription.set(
            task.model_name!,
            subs_for_this_task.reduce(
              (min: NodeSubscription, item: NodeSubscription) =>
                item.price_per_one_million_compute_units < min.price_per_one_million_compute_units ? item : min,
              cheapestSubscription.get(task.model_name!) || subs_for_this_task[0]
            )
          );
        }
        setModelsData(
          Object.values(ModelModality).reduce((acc: any, modality: ModelModality) => {
            acc[modality] = [...modelModalities]
              .filter(([_, modalities]) => modalities.includes(modality))
              .map(([modelName, modalities]) => {
                const model = cheapestSubscription.get(modelName);
                return {
                  name: modelName,
                  price: model!.price_per_one_million_compute_units / 1000000,
                  modalities,
                };
              });
            return acc;
          }, {})
        );
      } catch (error) {
        console.error("Failed to fetch models", error);
      }
    })();
  }, []);

  const modelSections: ModelSection[] = [
    {
      type: ModelModality.ChatCompletions,
      title: modalityToFeatureName(ModelModality.ChatCompletions),
      models: modelsData[ModelModality.ChatCompletions],
    },
    {
      type: ModelModality.ImagesGenerations,
      title: modalityToFeatureName(ModelModality.ImagesGenerations),
      models: modelsData[ModelModality.ImagesGenerations],
    },
    {
      type: ModelModality.Embeddings,
      title: modalityToFeatureName(ModelModality.Embeddings),
      models: modelsData[ModelModality.Embeddings],
    },
  ];

  // Reorder sections based on selected category
  const orderedSections = [
    // Selected category first
    ...modelSections.filter(section => section.type === selectedCategory),
    // Other categories after
    ...modelSections.filter(section => section.type !== selectedCategory),
  ];

  return (
    <div className="relative min-h-full w-full">
      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-primary">Models</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsConfidentialMode(!isConfidentialMode)}
                      className="p-1 rounded-full hover:bg-muted transition-colors"
                    >
                      {isConfidentialMode ? (
                        <Lock className="h-4 w-4 text-orange-500" />
                      ) : (
                        <Unlock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle confidential compute models</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              defaultValue="chat"
              value={selectedCategory}
              onValueChange={(value: ModelModality) => setSelectedCategory(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select completion type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ModelModality).map(modality => (
                  modelsData[modality].length > 0 ? (
                    <SelectItem key={modality} value={modality}>
                      {modalityToFeatureName(modality)}
                    </SelectItem>
                  ) : null
                ))}
              </SelectContent>
            </Select>
          </div>

          {orderedSections
            .filter(section => section.models.length > 0)
            .map(section => (
            <div key={section.type} className="space-y-6">
              <h2 className="text-lg font-medium text-primary">{section.title}</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {section.models.map(model => (
                  <ModelCard 
                    key={model.name} 
                    name={model.name} 
                    price={model.price} 
                    modalities={model.modalities} 
                    isConfidential={isConfidentialMode}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
