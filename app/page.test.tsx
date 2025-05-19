/// <reference types="@testing-library/jest-dom" />
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import NetworkStatusPage from "./page"; // Default export
import * as api from "@/lib/api";
import { useTheme } from "next-themes";
import { ModelModality, type Task, type NodeSubscription } from "@/lib/atoma-types"; // Correctly import Task and NodeSubscription

// --- Mocks ---
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}));

jest.mock("@/lib/api", () => ({
  getGraphs: jest.fn(),
  getTasks: jest.fn(),
  getSubscriptions: jest.fn(),
}));

jest.mock("next-themes", () => ({
  useTheme: jest.fn(() => ({ theme: "dark" })),
}));

jest.mock("@/components/analytics/metrics-cards", () => {
  const MockMetricsCards = () => <div data-testid="metrics-cards">MetricsCards Mock</div>;
  MockMetricsCards.displayName = "MockMetricsCards";
  return { MetricsCards: MockMetricsCards }; // Ensure named export is matched
});

jest.mock("@/components/LoadingCircle", () => {
  const MockLoadingCircle = ({ isSpinning, size }: { isSpinning?: boolean; size?: string }) =>
    isSpinning ? <div data-testid={`loading-circle-${size || "md"}`}>Loading...</div> : null;
  MockLoadingCircle.displayName = "MockLoadingCircle";
  return MockLoadingCircle;
});

// Mock the dynamically imported chart panels
jest.mock("@/components/charts/AreaPanel", () => {
  const MockComponent = jest.fn(() => <div data-testid="area-panel">AreaPanel Mock</div>);
  return MockComponent;
});

jest.mock("@/components/charts/BarGaugePanel", () => {
  const MockComponent = jest.fn(() => <div data-testid="bar-gauge-panel">BarGaugePanel Mock</div>);
  return MockComponent;
});

// --- Test Data ---
const mockGraphsData = [
  {
    title: "Network Performance",
    panels: [
      {
        title: "Time To First Token (TTFT)",
        description: "Fake description for TTFT",
        field_config: { defaults: { unit: "ms" } },
        from: "now-1h",
        type: "timeseries",
        data: {
          results: {
            graphRef1: {
              frames: [
                {
                  schema: {
                    fields: [
                      { name: "Time", type: "time", labels: {} },
                      { name: "TTFTValue", type: "number", labels: { model: "GenericChatModel" } },
                    ],
                  },
                  data: {
                    values: [
                      [Date.now() - 3600000, Date.now()],
                      [100, 150],
                    ],
                  },
                },
              ],
            },
          },
        },
      },
      {
        title: "Tokens Processed",
        description: "Fake description for Tokens Processed",
        field_config: { defaults: { unit: "tokens" } },
        from: "now-1h",
        type: "bargauge",
        data: {
          results: {
            graphRef2: {
              frames: [
                {
                  schema: {
                    fields: [
                      { name: "Time", type: "time", labels: {} },
                      { name: "GenericChatModel_Tokens", type: "number", labels: { model: "GenericChatModel" } },
                      { name: "GenericImageModel_Tokens", type: "number", labels: { model: "GenericImageModel" } },
                    ],
                  },
                  data: {
                    values: [
                      [Date.now() - 1800000, Date.now()],
                      [2000, 2500],
                      [1500, 1800],
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    ],
  },
];

// Use the imported Task and NodeSubscription types
const mockTasksData: [Task, ModelModality[]][] = [
  [
    {
      task_small_id: 10,
      task_id: "task_chat",
      role: 0,
      model_name: "GenericChatModel",
      is_deprecated: false,
      security_level: 0,
    },
    [ModelModality.ChatCompletions],
  ],
  [
    {
      task_small_id: 20,
      task_id: "task_image",
      role: 0,
      model_name: "GenericImageModel",
      is_deprecated: false,
      security_level: 0,
    },
    [ModelModality.ImagesGenerations],
  ],
];
const mockSubscriptionsData: NodeSubscription[] = [
  {
    task_small_id: 10,
    node_small_id: 1,
    price_per_one_million_compute_units: 1,
    max_num_compute_units: 1,
    valid: true,
  },
  {
    task_small_id: 20,
    node_small_id: 2,
    price_per_one_million_compute_units: 1,
    max_num_compute_units: 1,
    valid: true,
  },
];

// --- Test Suite ---
describe("NetworkStatusPage (app/page.tsx)", () => {
  let mockGetGraphs: jest.Mock;
  let mockGetTasks: jest.Mock;
  let mockGetSubscriptions: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetGraphs = api.getGraphs as jest.Mock;
    mockGetTasks = api.getTasks as jest.Mock;
    mockGetSubscriptions = api.getSubscriptions as jest.Mock;

    mockGetTasks.mockResolvedValue({ data: mockTasksData });
    mockGetSubscriptions.mockResolvedValue({ data: mockSubscriptionsData });
    mockGetGraphs.mockResolvedValue({ data: mockGraphsData });
  });

  it("renders MetricsCards and loading state initially", () => {
    mockGetGraphs.mockReturnValue(new Promise(() => {})); // Keep it pending
    render(<NetworkStatusPage />);
    expect(screen.getByTestId("metrics-cards")).toBeInTheDocument();
    expect(screen.getByTestId("loading-circle-lg")).toBeInTheDocument();
  });

  it("handles getGraphs API failure gracefully", async () => {
    mockGetGraphs.mockRejectedValue(new Error("API Error for graphs"));
    render(<NetworkStatusPage />);
    await waitFor(() => {
      expect(screen.queryByText("Network Performance")).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryByTestId("area-panel")).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryByTestId("bar-gauge-panel")).not.toBeInTheDocument();
    });
  });
});
