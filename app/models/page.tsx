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
import React from "react";

interface ModelSection {
  type: ModelModality;
  title: string;
  models: {
    name: string;
    price: string;
    modalities: ModelModality[];
  }[];
}

interface ModelSectionWithId extends ModelSection {
  id: string;
  isConfidential: boolean;
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
      <Card className="overflow-hidden flex flex-col h-full min-h-[180px]">
        <CardContent className="p-4 flex flex-col grow">
          <div className="flex justify-between items-start mb-3">
            <div className="pr-2">
              <h3 className="text-base font-medium leading-snug line-clamp-2">{simplifyModelName(name)}</h3>
              <p className="text-sm text-muted-foreground">${price} per 1M tokens</p>
            </div>
            <div className="flex flex-wrap items-center gap-1 max-w-[40%] justify-end">
              {modalities.map(modality => (
                <span
                  className={`inline-flex items-center rounded-md ${isConfidential && modality === ModelModality.ChatCompletions ? 'bg-orange-500/10 text-orange-500 ring-orange-500/20' : 'bg-primary/10 text-primary ring-primary/20'} px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap`}
                  key={modality}
                >
                  {isConfidential && modality === ModelModality.ChatCompletions && <Lock className="h-3 w-3 mr-1" />}
                  {ModalityToCategory[modality]}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-grow" />
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Link href="/playground" className="w-full">
              <Button variant="outline" className="w-full h-9">
                Playground
              </Button>
            </Link>
            <Button variant="outline" className="w-full h-9" onClick={() => setShowApiDialog(true)}>
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
  // Track currently selected modality and whether confidential mode is enabled via dropdown
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

  // Helper to encode/decode Select values (modality|confidentialFlag)
  const encodeSelectValue = (modality: ModelModality, confidential: boolean) => `${modality}|${confidential}`;
  const decodeSelectValue = (value: string): { modality: ModelModality; confidential: boolean } => {
    const [modalityStr, confidentialStr] = value.split("|");
    return {
      modality: modalityStr as ModelModality,
      confidential: confidentialStr === "true",
    };
  };

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

  // Build sections for both regular and confidential categories
  const modelSections = Object.values(ModelModality).flatMap(modality => {
    const baseTitle = modalityToFeatureName(modality);
    return [
      {
        id: encodeSelectValue(modality, false),
        title: baseTitle,
        models: modelsData[modality],
        isConfidential: false,
      },
      {
        id: encodeSelectValue(modality, true),
        title: `Confidential ${baseTitle}`,
        models: modelsData[modality],
        isConfidential: true,
      },
    ];
  });

  // Reorder so selected section appears first
  const selectedId = encodeSelectValue(selectedCategory, isConfidentialMode);
  const orderedSections = [
    ...modelSections.filter(section => section.id === selectedId),
    ...modelSections.filter(section => section.id !== selectedId),
  ];

  return (
    <div className="relative min-h-screen w-full">
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
              value={encodeSelectValue(selectedCategory, isConfidentialMode)}
              onValueChange={(value: string) => {
                const { modality, confidential } = decodeSelectValue(value);
                setSelectedCategory(modality);
                setIsConfidentialMode(confidential);
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select completion type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ModelModality).map(modality => (
                  modelsData[modality].length > 0 ? (
                    <React.Fragment key={modality}>
                      <SelectItem value={encodeSelectValue(modality, false)}>
                        {modalityToFeatureName(modality)}
                      </SelectItem>
                      <SelectItem value={encodeSelectValue(modality, true)}>
                        {`Confidential ${modalityToFeatureName(modality)}`}
                      </SelectItem>
                    </React.Fragment>
                  ) : null
                ))}
              </SelectContent>
            </Select>
          </div>

          {orderedSections
            .filter(section => section.models.length > 0)
            .map((section) => (
            <div key={section.id} className="space-y-6">
              <h2 className="text-lg font-medium text-primary">{section.title}</h2>
              <div
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {section.models.map((model) => (
                  <div key={model.name} className="h-full">
                    <ModelCard
                      name={model.name}
                      price={model.price}
                      modalities={model.modalities}
                      isConfidential={section.isConfidential}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
