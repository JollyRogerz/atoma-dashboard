import { readableModelName } from "./utils";
import { processModelsForCategory } from "./utils";
import { ModelModality, Task } from "@/lib/atoma-types";
import type { TaskResponse } from "./utils";
import { RenderRequestBodyBasedOnEndPoint, parseOutputBasedOnEndpoint } from "./utils";
import { type ModelCategories } from "@/app/playground/page";
import { AxiosResponse } from "axios";

describe("readableModelName", () => {
  it("should return empty string for undefined or null input", () => {
    expect(readableModelName(undefined as any)).toBe("");
    expect(readableModelName(null as any)).toBe("");
    expect(readableModelName("")).toBe("");
  });

  it("should return specific readable names for known models", () => {
    expect(readableModelName("Qwen/QwQ-32B")).toBe("QwQ 32B");
    expect(readableModelName("neuralmagic/DeepSeek-R1-Distill-Llama-70B-FP8-dynamic")).toBe(
      "DeepSeek R1 Distill Llama 70B"
    );
    expect(readableModelName("neuralmagic/Qwen2-72B-Instruct-FP8")).toBe("Qwen2 72B");
    expect(readableModelName("meta-llama/Llama-3.1-8B-Instruct")).toBe("Llama 3.1 8B");
    expect(readableModelName("Infermatic/Llama-3.3-70B-Instruct-FP8-Dynamic")).toBe("Llama 3.3 70B");
    expect(readableModelName("mistralai/Mistral-Nemo-Instruct-2407")).toBe("Mistral Nemo 2407");
    expect(readableModelName("DeepSeek-V3-0324")).toBe("DeepSeek V3 0324");
  });

  it("should extract name and size for unknown formats, placing size at the end", () => {
    expect(readableModelName("vendor/ModelName-7B-Extra")).toBe("ModelName Extra 7B");
    expect(readableModelName("AnotherModel-13B")).toBe("AnotherModel 13B");
    expect(readableModelName("Yet-Another-Model-40M-Instruct-FP16")).toBe("Yet Another Model 40M");
    expect(readableModelName("My-70B-Model-Name")).toBe("My Model Name 70B");
  });

  it("should handle names without vendor prefix correctly", () => {
    expect(readableModelName("MyModel-70B-Instruct")).toBe("MyModel 70B");
  });

  it("should strip -Instruct, -FP\d, -dynamic suffixes", () => {
    expect(readableModelName("Model-A-Instruct")).toBe("Model A");
    expect(readableModelName("Model-B-FP8")).toBe("Model B");
    expect(readableModelName("Model-C-dynamic")).toBe("Model C");
    expect(readableModelName("Model-D-Instruct-FP8-dynamic")).toBe("Model D");
  });

  it("should replace hyphens with spaces", () => {
    expect(readableModelName("some-model-name")).toBe("some model name");
  });

  it("should handle long names without truncation", () => {
    expect(readableModelName("ThisIsAVeryLongModelNameThatExceedsTheLimit")).toBe(
      "ThisIsAVeryLongModelNameThatExceedsTheLimit"
    );
    expect(readableModelName("ThisIsAnEvenLongerModelNameToTestTheTruncation-Instruct-FP8")).toBe(
      "ThisIsAnEvenLongerModelNameToTestTheTruncation"
    );
    expect(readableModelName("ShortBase-SuperExtremelyLongSizeSuffix123456789012345B")).toBe(
      "ShortBase SuperExtremelyLongSizeSuffix 123456789012345B"
    );
  });
});

describe("processModelsForCategory", () => {
  const mockModels: TaskResponse = [
    [
      {
        task_small_id: 1,
        task_id: "task1",
        role: 0,
        model_name: "modelA/ChatModel-7B",
        is_deprecated: false,
        security_level: 0,
      },
      [ModelModality.ChatCompletions, ModelModality.Embeddings],
    ],
    [
      {
        task_small_id: 2,
        task_id: "task2",
        role: 0,
        model_name: "modelB/ImageModel-Std",
        is_deprecated: false,
        security_level: 0,
      },
      [ModelModality.ImagesGenerations],
    ],
    [
      {
        task_small_id: 3,
        task_id: "task3",
        role: 0,
        model_name: "modelC/EmbeddingModel-LargeWhichIsAlsoQuiteLong",
        is_deprecated: false,
        security_level: 0,
      },
      [ModelModality.Embeddings],
    ],
    [
      {
        task_small_id: 4,
        task_id: "task4",
        role: 0,
        model_name: "modelA/ChatModel-7B",
        is_deprecated: false,
        security_level: 0,
      },
      [ModelModality.ChatCompletions],
    ],
    [
      {
        task_small_id: 5,
        task_id: "task5",
        role: 0,
        model_name: "modelD/MultiModal-LongNameForTestingTruncationAndThisIsEvenLonger",
        is_deprecated: false,
        security_level: 0,
      },
      [ModelModality.ChatCompletions, ModelModality.ImagesGenerations],
    ],
    [
      {
        task_small_id: 6,
        task_id: "task6",
        role: 0,
        model_name: "modelE/NoCaps-Deprecated",
        is_deprecated: true,
        security_level: 0,
      },
      [ModelModality.ChatCompletions],
    ],
    [
      {
        task_small_id: 7,
        task_id: "task7",
        role: 0,
        model_name: "modelF/ChatOnly-AlsoAVeryLongNameToTestTruncationIndeedAndFurtherMore",
        is_deprecated: false,
        security_level: 0,
      },
      [ModelModality.ChatCompletions],
    ],
  ];

  it("should return correct models for chat category", () => {
    const chatModels = processModelsForCategory(mockModels, "chat");
    expect(chatModels).toEqual(
      expect.arrayContaining([
        { modelName: "ChatModel 7B", model: "modelA/ChatModel-7B" },
        {
          modelName: "MultiModal LongNameForTestingTruncationAndThisIsEvenLonger",
          model: "modelD/MultiModal-LongNameForTestingTruncationAndThisIsEvenLonger",
        },
        {
          modelName: "ChatOnly AlsoAVeryLongNameToTestTruncationIndeedAndFurtherMore",
          model: "modelF/ChatOnly-AlsoAVeryLongNameToTestTruncationIndeedAndFurtherMore",
        },
      ])
    );
    expect(chatModels.length).toBe(3);
  });

  it("should return correct models for images category", () => {
    const imageModels = processModelsForCategory(mockModels, "images");
    expect(imageModels).toEqual(
      expect.arrayContaining([
        { modelName: "ImageModel Std", model: "modelB/ImageModel-Std" },
        {
          modelName: "MultiModal LongNameForTestingTruncationAndThisIsEvenLonger",
          model: "modelD/MultiModal-LongNameForTestingTruncationAndThisIsEvenLonger",
        },
      ])
    );
    expect(imageModels.length).toBe(2);
  });

  it("should return correct models for embeddings category", () => {
    const embeddingModels = processModelsForCategory(mockModels, "embeddings");
    expect(embeddingModels).toEqual(
      expect.arrayContaining([
        { modelName: "ChatModel 7B", model: "modelA/ChatModel-7B" },
        {
          modelName: "EmbeddingModel LargeWhichIsAlsoQuiteLong",
          model: "modelC/EmbeddingModel-LargeWhichIsAlsoQuiteLong",
        },
      ])
    );
    expect(embeddingModels.length).toBe(2);
  });

  it("should return an empty array for an unknown category", () => {
    const unknownCategoryModels = processModelsForCategory(mockModels, "unknown" as any);
    expect(unknownCategoryModels).toEqual([]);
  });

  it("should handle empty model list", () => {
    const emptyModels = processModelsForCategory([], "chat");
    expect(emptyModels).toEqual([]);
  });

  it("should ensure model names are unique", () => {
    const chatModels = processModelsForCategory(mockModels, "chat");
    const modelANames = chatModels.filter(m => m.model === "modelA/ChatModel-7B");
    expect(modelANames.length).toBe(1);
  });
});

describe("RenderRequestBodyBasedOnEndPoint", () => {
  const selectedModel = "test-model";
  const message = "hello world";
  const parameters = {
    systemPrompt: "Default",
    customSystemPrompt: "Be a custom helpful assistant.",
    outputLength: 100,
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    repetitionPenalty: 1.1,
  };
  const baseMessages = [{ role: "user" as const, content: "previous message" }];

  it("should format chat request correctly with default system prompt", () => {
    const body = RenderRequestBodyBasedOnEndPoint("chat", selectedModel, message, parameters, baseMessages);
    expect(body).toEqual({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        ...baseMessages,
        { role: "user", content: message },
      ],
      model: selectedModel,
      max_tokens: parameters.outputLength,
      temperature: parameters.temperature,
      top_p: parameters.topP,
      top_k: parameters.topK,
      repetition_penalty: parameters.repetitionPenalty,
    });
  });

  it("should format chat request correctly with custom system prompt", () => {
    const customParams = { ...parameters, systemPrompt: "Custom" };
    const body = RenderRequestBodyBasedOnEndPoint("chat", selectedModel, message, customParams, baseMessages);
    if (body && "messages" in body && Array.isArray(body.messages) && body.messages.length > 0) {
      expect(body.messages[0].content).toBe(customParams.customSystemPrompt);
    } else {
      throw new Error("Chat request body does not have the expected messages structure.");
    }
  });

  it("should format embeddings request correctly", () => {
    const body = RenderRequestBodyBasedOnEndPoint("embeddings", selectedModel, message, parameters, baseMessages);
    expect(body).toEqual({
      model: selectedModel,
      input: message,
    });
  });

  it("should format images request correctly", () => {
    const body = RenderRequestBodyBasedOnEndPoint("images", selectedModel, message, parameters, baseMessages);
    expect(body).toEqual({
      model: selectedModel,
      prompt: message,
    });
  });
});

describe("parseOutputBasedOnEndpoint", () => {
  it("should parse chat output correctly", () => {
    const mockResponse = {
      data: { choices: [{ message: { content: "chat response" } }] },
    } as AxiosResponse;
    expect(parseOutputBasedOnEndpoint("chat", mockResponse)).toBe("chat response");
  });

  it("should parse embeddings output correctly", () => {
    const mockResponse = {
      data: { data: [{ embedding: [0.1, 0.2, 0.3] }] },
    } as AxiosResponse;
    expect(parseOutputBasedOnEndpoint("embeddings", mockResponse)).toBe("0.1,0.2,0.3");
  });

  it("should return undefined for images category as it has no specific parsing", () => {
    const mockResponse = { data: {} } as AxiosResponse;
    expect(parseOutputBasedOnEndpoint("images", mockResponse)).toBeUndefined();
  });

  it("should handle missing data gracefully for chat by throwing error", () => {
    const mockResponse = { data: {} } as AxiosResponse;
    expect(() => parseOutputBasedOnEndpoint("chat", mockResponse)).toThrow();
  });

  it("should handle missing data gracefully for embeddings by throwing error", () => {
    const mockResponse = { data: {} } as AxiosResponse;
    expect(() => parseOutputBasedOnEndpoint("embeddings", mockResponse)).toThrow();
  });
});
