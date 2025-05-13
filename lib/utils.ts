import type { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { WalletAccount } from "@mysten/wallet-standard";
import type { UseMutateAsyncFunction } from "@tanstack/react-query";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios, { AxiosError } from "axios";
import { ModelModality } from "./atoma";

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

const USDC_TYPE = process.env.NEXT_PUBLIC_USDC_TYPE;

export const payUSDC = async (
  amount: number,
  client: SuiClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signAndExecuteTransaction: UseMutateAsyncFunction<any, any, any, unknown>,
  account: WalletAccount
): Promise<unknown> => {
  const accountAddress = account.address;
  const { data: coins } = await client.getCoins({
    owner: accountAddress,
    coinType: USDC_TYPE,
  });
  const tx = new Transaction();
  let remainingAmount = Math.floor(amount);
  const selectedCoins = [];

  for (const coin of coins) {
    if (parseInt(coin.balance) >= remainingAmount) {
      const [splitCoin] = tx.splitCoins(coin.coinObjectId, [tx.pure.u64(remainingAmount)]);
      selectedCoins.push(splitCoin);
      remainingAmount = 0;
      break;
    } else {
      selectedCoins.push(coin.coinObjectId);
      remainingAmount -= parseInt(coin.balance);
    }
  }

  if (remainingAmount > 0) {
    throw new Error("Insufficient balance to cover the amount");
  }
  if (process.env.NEXT_PUBLIC_PROXY_WALLET == null) {
    throw new Error("Proxy wallet address not found");
  }
  tx.transferObjects(selectedCoins, process.env.NEXT_PUBLIC_PROXY_WALLET);
  tx.setSender(accountAddress);
  return await signAndExecuteTransaction({
    transaction: tx,
    account,
  });
};

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
