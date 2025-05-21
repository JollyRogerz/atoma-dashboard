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
  const sizeMatch = namePart.match(/(\d+[BM])/);
  const size = sizeMatch ? sizeMatch[0] : "";

  // More robust suffix stripping order matters here from more specific to less specific
  const suffixesToRemove = [
    /-Instruct-FP\d-dynamic$/i,
    /-Instruct-FP\d$/i,
    /-Instruct-dynamic$/i,
    /-FP\d-dynamic$/i,
    /-Instruct$/i,
    /-FP\d$/i, // This will catch -FP8, -FP16 etc.
    /-dynamic$/i,
  ];

  for (const suffixRegex of suffixesToRemove) {
    namePart = namePart.replace(suffixRegex, "");
  }

  // Replace hyphens and multiple spaces
  namePart = namePart.replace(/-/g, " ").replace(/\s+/g, " ").trim();

  if (size) {
    // Remove the extracted size string from the name part to avoid duplication, then trim
    let nameWithoutSize = namePart.replace(size, "").replace(/\s+/g, " ").trim();
    namePart = nameWithoutSize ? `${nameWithoutSize} ${size}` : size;
  }

  // Limit length for chart display
  if (namePart.length > 15) {
    namePart = namePart.substring(0, 13) + "...";
  }

  return namePart;
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
