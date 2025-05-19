/// <reference types="@testing-library/jest-dom" />
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ModelsPage from "./page"; // Default export
import * as api from "@/lib/api";
import { ModelModality, type Task, type NodeSubscription } from "@/lib/atoma-types";

// --- Mocks ---
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/models"), // Mock pathname for this page
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("@/lib/api", () => ({
  getTasks: jest.fn(),
  getSubscriptions: jest.fn(),
}));

// Mock child UI components that are not the focus of ModelsPage logic itself
jest.mock("@/components/ui/select", () => {
  const Select = ({
    children,
    value,
    onValueChange,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode[];
  }) => {
    let selectItems: React.ReactNode[] = [];
    let triggerContentNode: React.ReactNode = null;
    // eslint-disable-next-line testing-library/no-node-access
    React.Children.forEach(children, child => {
      if (React.isValidElement(child)) {
        if (
          (child.type as any).displayName === "MockSelectContent" ||
          (child.type as any).displayName === "SelectContent"
        ) {
          // eslint-disable-next-line testing-library/no-node-access
          selectItems = React.Children.toArray((child.props as any).children);
        } else if (
          (child.type as any).displayName === "MockSelectTrigger" ||
          (child.type as any).displayName === "SelectTrigger"
        ) {
          triggerContentNode = child;
        }
      }
    });

    return (
      <div>
        {triggerContentNode}
        <select data-testid="select-modality" value={value} onChange={e => onValueChange(e.target.value)}>
          {selectItems}
        </select>
      </div>
    );
  };
  Select.displayName = "MockSelect";

  const SelectTrigger = ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>;
  SelectTrigger.displayName = "MockSelectTrigger";

  const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>;
  SelectValue.displayName = "MockSelectValue";

  const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  SelectContent.displayName = "MockSelectContent";

  const SelectItem = ({ children, value }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  );
  SelectItem.displayName = "MockSelectItem";

  return {
    __esModule: true,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
  };
});

jest.mock("@/components/api-usage-dialog", () => ({
  ApiUsageDialog: jest.fn(({ isOpen, onClose, modelName, modality, isConfidential }) =>
    isOpen ? (
      <div data-testid="api-usage-dialog" onClick={onClose}>
        Dialog for {modelName} ({modality}) Conf: {isConfidential.toString()}
      </div>
    ) : null
  ),
}));

// Mock Tooltip components from Radix, as they are used by ModelCard (via Lock icon)
jest.mock("@radix-ui/react-tooltip", () => ({
  Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Root: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Trigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <button>{children}</button>,
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Arrow: () => null,
}));

// Mock lucide-react icons used in ModelCard, if necessary
jest.mock("lucide-react", () => ({
  ...jest.requireActual("lucide-react"), // Keep other icons working if used elsewhere
  Lock: () => <svg data-testid="lock-icon" />,
  Unlock: () => <svg data-testid="unlock-icon" />,
}));

// --- Test Data ---
const mockTasksData: [Task, ModelModality[]][] = [
  [
    { task_small_id: 1, task_id: "t1", role: 1, model_name: "ModelAlpha-7B", is_deprecated: false, security_level: 1 },
    [ModelModality.ChatCompletions, ModelModality.Embeddings],
  ],
  [
    { task_small_id: 2, task_id: "t2", role: 1, model_name: "ModelBeta-Img", is_deprecated: false, security_level: 0 },
    [ModelModality.ImagesGenerations],
  ],
  [
    {
      task_small_id: 3,
      task_id: "t3",
      role: 1,
      model_name: "ModelGamma-Chat",
      is_deprecated: false,
      security_level: 1,
    },
    [ModelModality.ChatCompletions],
  ],
];

const mockSubscriptionsData: NodeSubscription[] = [
  {
    task_small_id: 1,
    node_small_id: 101,
    price_per_one_million_compute_units: 100000,
    max_num_compute_units: 1000,
    valid: true,
  },
  {
    task_small_id: 2,
    node_small_id: 102,
    price_per_one_million_compute_units: 200000,
    max_num_compute_units: 1000,
    valid: true,
  },
  {
    task_small_id: 3,
    node_small_id: 103,
    price_per_one_million_compute_units: 50000,
    max_num_compute_units: 1000,
    valid: true,
  },
];

describe("ModelsPage", () => {
  let mockGetTasks: jest.Mock;
  let mockGetSubscriptions: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTasks = api.getTasks as jest.Mock;
    mockGetSubscriptions = api.getSubscriptions as jest.Mock;

    mockGetTasks.mockResolvedValue({ data: mockTasksData });
    mockGetSubscriptions.mockResolvedValue({ data: mockSubscriptionsData });
  });

  it("renders models correctly after fetching data", async () => {
    render(<ModelsPage />);
    expect(mockGetTasks).toHaveBeenCalled();
    expect(mockGetSubscriptions).toHaveBeenCalled();
    expect((await screen.findAllByText("ModelAlpha 7B")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("ModelBeta Img")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("ModelGamma Chat")).length).toBeGreaterThan(0);
  });

  it("filters models by category using the Select component", async () => {
    const user = userEvent.setup();
    render(<ModelsPage />);
    expect((await screen.findAllByText("ModelAlpha 7B")).length).toBeGreaterThan(0);

    const selectElement = screen.getByTestId("select-modality");
    const imageOptionValue = `${ModelModality.ImagesGenerations}|false`;
    await user.selectOptions(selectElement, imageOptionValue);

    await waitFor(async () => {
      const imageSectionTitle = await screen.findByRole("heading", { name: /^Image Generation$/, level: 2 });
      // eslint-disable-next-line testing-library/no-node-access
      const imageSection = imageSectionTitle.closest("div.space-y-4");
      expect(imageSection).toBeInTheDocument();
      if (imageSection) {
        expect(within(imageSection as HTMLElement).queryByText("ModelAlpha 7B")).not.toBeInTheDocument();
        expect(within(imageSection as HTMLElement).queryByText("ModelGamma Chat")).not.toBeInTheDocument();
        expect(within(imageSection as HTMLElement).getByText("ModelBeta Img")).toBeInTheDocument();
      }
    });
  });

  it("opens ApiUsageDialog when API button on a ModelCard is clicked", async () => {
    const user = userEvent.setup();
    render(<ModelsPage />);
    const modelAlphaSectionTitle = await screen.findByRole("heading", { name: /^Chat Completion$/, level: 2 });
    // eslint-disable-next-line testing-library/no-node-access
    const modelAlphaSection = modelAlphaSectionTitle.closest("div.space-y-4");
    expect(modelAlphaSection).toBeInTheDocument();

    if (modelAlphaSection) {
      // eslint-disable-next-line testing-library/no-node-access
      const modelAlphaCard = within(modelAlphaSection as HTMLElement)
        .getByText("ModelAlpha 7B")
        .closest("div.h-full");
      expect(modelAlphaCard).toBeInTheDocument();
      if (modelAlphaCard) {
        // eslint-disable-next-line testing-library/no-node-access
        const apiButton = within(modelAlphaCard as HTMLElement).getByRole("button", { name: /API/i });
        await user.click(apiButton);
        expect(await screen.findByTestId("api-usage-dialog")).toBeInTheDocument();
        expect(screen.getByTestId("api-usage-dialog")).toHaveTextContent("Dialog for ModelAlpha-7B");
      }
    }
  });

  it("filters confidential models using the Select component", async () => {
    const user = userEvent.setup();
    render(<ModelsPage />);
    expect((await screen.findAllByText("ModelAlpha 7B")).length).toBeGreaterThan(0);

    const selectElement = screen.getByTestId("select-modality");
    const chatConfidentialValue = `${ModelModality.ChatCompletions}|true`;
    await user.selectOptions(selectElement, chatConfidentialValue);

    // Split waitFor for multiple assertions to satisfy linter
    await waitFor(async () => {
      const confidentialChatSectionTitle = await screen.findByRole("heading", {
        name: /^Confidential Chat Completion$/,
        level: 2,
      });
      // eslint-disable-next-line testing-library/no-node-access
      const confidentialChatSection = confidentialChatSectionTitle.closest("div.space-y-4");
      expect(confidentialChatSection).toBeInTheDocument();
      if (confidentialChatSection) {
        expect(within(confidentialChatSection as HTMLElement).getByText("ModelAlpha 7B")).toBeInTheDocument();
      }
    });
    await waitFor(async () => {
      const confidentialChatSectionTitle = await screen.findByRole("heading", {
        name: /^Confidential Chat Completion$/,
        level: 2,
      });
      // eslint-disable-next-line testing-library/no-node-access
      const confidentialChatSection = confidentialChatSectionTitle.closest("div.space-y-4");
      if (confidentialChatSection) {
        expect(within(confidentialChatSection as HTMLElement).getByText("ModelGamma Chat")).toBeInTheDocument();
      }
    });
    await waitFor(async () => {
      const confidentialChatSectionTitle = await screen.findByRole("heading", {
        name: /^Confidential Chat Completion$/,
        level: 2,
      });
      // eslint-disable-next-line testing-library/no-node-access
      const confidentialChatSection = confidentialChatSectionTitle.closest("div.space-y-4");
      if (confidentialChatSection) {
        expect(within(confidentialChatSection as HTMLElement).queryByText("ModelBeta Img")).not.toBeInTheDocument();
      }
    });
  });
});
