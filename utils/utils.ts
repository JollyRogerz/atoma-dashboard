import { ModelCategories } from "@/app/playground/page";
import { AxiosResponse } from "axios";
import { getTasks } from "@/lib/api";
import { Task, ModelModality } from "@/lib/atoma-types";

export type TaskResponse = [Task, ModelModality[]][];

export async function fetchAvailableModels(): Promise<TaskResponse> {
  try {
    const response = await getTasks();
    return response.data;
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
}

export function readableModelName(modelName: string): string {
  if (!modelName) return "";

  let namePart = modelName.split("/").pop() || modelName;
  const sizeMatch = namePart.match(/(\d+[BM])/i); // case-insensitive size match
  const size = sizeMatch ? sizeMatch[0] : "";

  const suffixesToRemove = [
    /-Instruct-FP\d+-dynamic$/i,
    /-Instruct-FP\d+$/i,
    /-Instruct-dynamic$/i,
    /-FP\d+-dynamic$/i,
    /-Instruct$/i,
    /-FP\d+$/i,
    /-dynamic$/i,
  ];

  for (const suffixRegex of suffixesToRemove) {
    namePart = namePart.replace(suffixRegex, "");
  }

  // Additional cleanup for cases where tokens appear in the middle of the string
  namePart = namePart
    .replace(/-Instruct/gi, "")
    .replace(/-FP\d+/gi, "")
    .replace(/-dynamic/gi, "");

  namePart = namePart.replace(/-/g, " ").replace(/\s+/g, " ").trim();

  let baseName = namePart;
  if (size) {
    // Remove the first occurrence of the size token (e.g. 70B, 40M) from anywhere in the string to avoid duplication
    const sizeRemovalRegex = new RegExp(size, "i");
    baseName = namePart.replace(sizeRemovalRegex, "").replace(/\s+/g, " ").trim();
  }

  let finalName = baseName;
  if (size && baseName) {
    finalName = `${baseName} ${size}`;
  } else if (size && !baseName) {
    finalName = size;
  }

  return finalName;
}

export function processModelsForCategory(
  models: TaskResponse,
  category: ModelCategories
): { modelName: string; model: string }[] {
  const uniqueModels = new Map<string, { modelName: string; model: string }>();

  models
    .filter(([task, capabilities]) => {
      if (task.is_deprecated) return false;
      switch (category) {
        case "chat":
          return capabilities.includes(ModelModality.ChatCompletions);
        case "embeddings":
          return capabilities.includes(ModelModality.Embeddings);
        case "images":
          return capabilities.includes(ModelModality.ImagesGenerations);
        default:
          return false;
      }
    })
    .forEach(([task]) => {
      const modelId = task.model_name || "";
      if (modelId && !uniqueModels.has(modelId)) {
        uniqueModels.set(modelId, {
          modelName: readableModelName(modelId),
          model: modelId,
        });
      }
    });

  return Array.from(uniqueModels.values());
}

export function RenderRequestBodyBasedOnEndPoint(
  endpoint: ModelCategories,
  selectedModel: string,
  message: string,
  parameters: {
    systemPrompt: string;
    customSystemPrompt: string;
    outputLength: number;
    temperature: number;
    topP: number;
    topK: number;
    repetitionPenalty: number;
  },
  messages: { role: "user" | "assistant"; content: string }[] = []
) {
  switch (endpoint) {
    case "chat":
      return {
        messages: [
          {
            role: "system",
            content:
              parameters.systemPrompt === "Custom" ? parameters.customSystemPrompt : "You are a helpful assistant.",
          },
          ...messages,
          { role: "user", content: message },
        ],
        model: selectedModel,
        max_tokens: parameters.outputLength,
        temperature: parameters.temperature,
        top_p: parameters.topP,
        top_k: parameters.topK,
        repetition_penalty: parameters.repetitionPenalty,
      };
    case "embeddings":
      return {
        model: selectedModel,
        input: message,
      };
    case "images":
      return {
        model: selectedModel,
        prompt: message,
      };
  }
}

export function parseOutputBasedOnEndpoint(endpoint: ModelCategories, response: AxiosResponse) {
  switch (endpoint) {
    case "chat":
      return response.data.choices[0].message.content;
    case "embeddings":
      return `${response.data?.data[0]?.embedding}`;
    case "images":

    default:
      break;
  }
}
