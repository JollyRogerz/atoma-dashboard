export interface NodeSubscription {
  node_small_id: number;
  task_small_id: number;
  price_per_one_million_compute_units: number;
  max_num_compute_units: number;
  valid: boolean;
}

export enum ModelModality {
  ChatCompletions = "Chat Completions",
  ImagesGenerations = "Images Generations",
  Embeddings = "Embeddings",
}

export interface Token {
  created_at: string;
  name: string;
  last_used_timestamp: string;
  token_last_4: string;
  id: number;
}

export interface Task {
  task_small_id: number;
  task_id: string;
  role: number;
  model_name?: string;
  is_deprecated: boolean;
  valid_until_epoch?: number;
  deprecated_at_epoch?: number;
  security_level: number;
  minimum_reputation_score?: number;
}

export interface StatsStack {
  timestamp: string;
  num_compute_units: number;
  settled_num_compute_units: number;
}

export interface Stack {
  owner: string;
  stack_small_id: number;
  stack_id: string;
  task_small_id: number;
  selected_node_id: number;
  num_compute_units: number;
  price_per_one_million_compute_units: number;
  already_computed_units: number;
  in_settle_period: boolean;
  total_hash: Uint8Array;
  num_total_messages: number;
  created_at: string;
  settled_at: string;
}

export interface AuthResponse {
  refresh_token: string;
  access_token: string;
}

export interface ComputedUnitsProcessedResponse {
  timestamp: string;
  model_name: string;
  amount: number;
  requests: number;
  time: number;
}

export interface LatencyResponse {
  timestamp: string;
  latency: number;
  requests: number;
}

export interface UserProfile {
  email: string;
}
