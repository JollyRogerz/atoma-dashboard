import axios from "axios";
import config from "../config/config";
import type {
  AuthResponse,
  ComputedUnitsProcessedResponse,
  LatencyResponse,
  ModelModality,
  NodeSubscription,
  Stack,
  StatsStack,
  Task,
  Token,
  UserProfile,
} from "./atoma-types";

import { Toast } from "primereact/toast";

let toastRef: Toast | null = null;

export const setToastRef = (toast: Toast) => {
  toastRef = toast;
};

const handleError = (error: any) => {
  let message = "An error occurred.";
  if (error.response) {
    message = error.response.data?.message || `Error: ${error.response.status}`;
  } else if (error.request) {
    message = "Network error. Please check your connection.";
  } else {
    message = error.message;
  }

  if (toastRef) {
    toastRef.show({ severity: "error", summary: "Error", detail: message });
  }

  return Promise.reject(error);
};

// Create an API client for the credentials API
const credentialsApi = axios.create({
  baseURL: config.ATOMA_CREDENTIALS_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create an API client for the main Atoma API
const atomaApi = axios.create({
  baseURL: config.ATOMA_API_URL,
  timeout: 10000, // Longer timeout for model inference
  headers: {
    "Content-Type": "application/json",
  },
});

credentialsApi.interceptors.response.use(response => response, handleError);

atomaApi.interceptors.response.use(response => response, handleError);

// Add authentication interceptor to both clients
const addAuthInterceptor = (apiClient: any) => {
  apiClient.interceptors.request.use(
    (config: any) => {
      const userSettings = sessionStorage.getItem("userSettings");
      if (!userSettings) {
        console.warn("User settings not found in local storage");
      } else {
        const token = JSON.parse(userSettings).accessToken;
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );
};

addAuthInterceptor(credentialsApi);
addAuthInterceptor(atomaApi);

export const getSubscriptions = async () => {
  return await credentialsApi.get<NodeSubscription[]>("/subscriptions");
};

export const getAllTasks = async () => {
  return await credentialsApi.get<[Task, ModelModality[]][]>("/tasks");
};

export const getTasks = async () => {
  const tasks_with_modalities = await getAllTasks();
  // Filter out deprecated tasks and tasks without model names and modalities (no modalities means the proxy doesn't support the task)
  tasks_with_modalities.data = tasks_with_modalities.data.filter(
    ([task, modalities]) => !task.is_deprecated && !!task.model_name && modalities.length > 0
  );
  return tasks_with_modalities;
};

export const registerUser = async (profile: UserProfile, password: string) => {
  return await credentialsApi.post<AuthResponse>("/register", { user_profile: profile, password });
};

export const loginUser = async (email: string, password: string) => {
  return await credentialsApi.post<AuthResponse>("/login", { email, password });
};

export const generateApiKey = async (name: string) => {
  return await credentialsApi.post<string>("/generate_api_token", { name });
};

export const revokeApiToken = async (api_token_id: number) => {
  return await credentialsApi.post<void>("/revoke_api_token", { api_token_id });
};

export const listApiKeys = async () => {
  return await credentialsApi.get<Token[]>("/api_tokens");
};

export const getComputeUnitsProcessed = async () => {
  const hoursSince2025 = Math.floor((Date.now() - new Date("2025-01-01T00:00:00Z").getTime()) / (1000 * 60 * 60));
  return await credentialsApi.get<ComputedUnitsProcessedResponse[]>(`/compute_units_processed?hours=${hoursSince2025}`);
};

export const getLatency = async () => {
  return await credentialsApi.get<LatencyResponse[]>("/latency?hours=168");
};

export const getNodesDistribution = async () => {
  return await credentialsApi.get<{ country: string; count: number }[]>("/get_nodes_distribution");
};

export const getStatsStacks = async () => {
  return await credentialsApi.get<StatsStack[]>("/get_stats_stacks?hours=168");
};

export const proofRequest = async (signature: string, walletAddress: string) => {
  return await credentialsApi.post<void>("/update_sui_address", { signature, address: walletAddress });
};

export const usdcPayment = async (txDigest: string, proofSignature?: string) => {
  return await credentialsApi.post<void>("/usdc_payment", {
    transaction_digest: txDigest,
    proof_signature: proofSignature,
  });
};

export const getSuiAddress = async () => {
  return await credentialsApi.get<string>("/get_sui_address");
};

export const getBalance = async () => {
  return await credentialsApi.get<number>("/balance");
};

export const getAllStacks = async () => {
  return await credentialsApi.get<[Stack, string][]>("/all_stacks");
};

export const getUserProfile = async () => {
  return await credentialsApi.get<UserProfile>("/user_profile");
};

export const googleOAuth = async (idToken: string) => {
  return await credentialsApi.post<AuthResponse>("/google_oauth", idToken);
};

export const getSalt = async () => {
  return await credentialsApi.get<string>("/zk_salt");
};

export const getGraphs = async () => {
  return await credentialsApi.get<
    {
      title: string;
      panels: { description?: string; title: string; field_config: any; from: string; type: string; data: any }[];
    }[]
  >("/get_graphs");
};

export interface Stats {
  title: string;
  panels: { description?: string; title: string; field_config: any; from: string; type: string; data: any }[];
}

export const getStats = async () => {
  return await credentialsApi.get<Stats[]>("/get_stats");
};

export const getGraphData = async (query: any) => {
  return await credentialsApi.post<any>("/get_graph_data", query);
};
