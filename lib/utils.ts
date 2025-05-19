import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios, { AxiosError } from "axios";
import { ModelModality } from "./atoma-types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function simplifyModelName(model: string): string {
  return model.replace(/^.*\//, "").replaceAll(/-/g, " ");
}

export function formatNumber(num?: number): string {
  if (num === undefined) return "";
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  if (num % 1 !== 0) {
    return num.toFixed(2);
  }
  return num.toString();
}

export const modalityToFeatureName = (modality: ModelModality): string => {
  switch (modality) {
    case ModelModality.ChatCompletions:
      return "Chat Completion";
    case ModelModality.ImagesGenerations:
      return "Image Generation";
    case ModelModality.Embeddings:
      return "Embedding";
    default:
      return modality;
  }
};

// For tables: CSS class for model name ellipsis handling
export const modelNameEllipsisClass = "whitespace-normal break-words cursor-pointer";

// API Error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isTimeout?: boolean,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const handleApiError = (error: AxiosError | unknown): never => {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      throw new ApiError("Request timed out. Please try again.", undefined, true, error);
    }

    const statusCode = error.response?.status;
    const message = error.response?.data?.message || error.message;

    throw new ApiError(message || "An error occurred while making the request", statusCode, false, error);
  }

  throw new ApiError("An unexpected error occurred", undefined, false, error);
};

export const errorHandler = async <T>(apiCall: () => Promise<T>): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: unknown) {
    throw handleApiError(error);
  }
};
