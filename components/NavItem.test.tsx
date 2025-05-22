/// <reference types="@testing-library/jest-dom" />
import React from "react";
import { render, screen, within } from "@testing-library/react";
import { ChevronRight } from "lucide-react";
import NavItem, { NavItemProps } from "./NavItem"; // Correctly import NavItem and its props type

// Mock next/navigation
let mockPathname = "/";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock TooltipPrimitive from @radix-ui/react-tooltip
jest.mock("@radix-ui/react-tooltip", () => ({
  Provider: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-provider">{children}</div>,
  Root: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-root">{children}</div>,
  Trigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
    // If asChild is true, React Testing Library might interact with the child directly.
    // For simplicity in mock, if asChild, just render children. Otherwise, a button.
    return asChild ? <>{children}</> : <button data-testid="tooltip-trigger">{children}</button>;
  },
  Portal: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-portal">{children}</div>,
  Content: ({
    children /*, side, sideOffset, ...props // Destructure but don't spread all unknown props to div */,
  }: {
    children: React.ReactNode;
    [key: string]: any;
  }) => (
    <div data-testid="tooltip-content">{children}</div> // Only pass children and known/safe attributes if needed
  ),
  Arrow: () => <div data-testid="tooltip-arrow" />,
}));

// Mock useSettings context if NavItem uses it (it doesn't directly, Sidebar does)
// jest.mock('@/contexts/settings-context', () => ({
//   useSettings: () => ({ settings: { loggedIn: true } }),
// }));

describe("NavItem", () => {
  const mockItem: NavItemProps["item"] = {
    name: "Test Item",
    href: "/test-path",
    icon: ChevronRight, // Lucide icons render as SVGs
  };

  const mockExternalItem: NavItemProps["item"] = {
    name: "External Link",
    href: "https://example.com",
    icon: ChevronRight,
  };

  beforeEach(() => {
    // Reset pathname before each test
    mockPathname = "/";
  });

  it("renders item name and icon when not collapsed", () => {
    render(<NavItem item={mockItem} isCollapsed={false} mounted={true} />);
    expect(screen.getByText("Test Item")).toBeInTheDocument();
    const linkElement = screen.getByRole("link");
    // eslint-disable-next-line testing-library/no-node-access
    expect(linkElement.querySelector("svg")).toBeInTheDocument();
  });

  it("renders only icon (visually) and link when collapsed, with tooltip structure", () => {
    render(<NavItem item={mockItem} isCollapsed={true} mounted={true} />);
    const linkElement = screen.getByRole("link");

    expect(within(linkElement).queryByText("Test Item")).not.toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access
    expect(linkElement.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-provider")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip-root")).toBeInTheDocument();

    const tooltipContent = screen.getByTestId("tooltip-content");
    expect(tooltipContent).toHaveTextContent("Test Item");
    // Check if tooltip content is initially hidden or becomes visible on hover (more advanced test)
  });

  it("applies active styles when pathname matches href", () => {
    mockPathname = "/test-path";
    render(<NavItem item={mockItem} isCollapsed={false} mounted={true} />);
    // Get link by its accessible name, which includes the text content.
    const linkElement = screen.getByRole("link", { name: "Test Item" });
    expect(linkElement).toHaveClass("bg-secondary");
  });

  it("does not apply active styles when pathname does not match", () => {
    mockPathname = "/other-path";
    render(<NavItem item={mockItem} isCollapsed={false} mounted={true} />);
    const linkElement = screen.getByRole("link", { name: "Test Item" });
    expect(linkElement).not.toHaveClass("bg-secondary");
    expect(linkElement).toHaveClass("text-muted-foreground");
  });

  it("renders as an external link correctly", () => {
    render(<NavItem item={mockExternalItem} isCollapsed={false} mounted={true} />);
    const linkElement = screen.getByRole("link", { name: "External Link" }) as HTMLAnchorElement;
    // Check if the href starts with the mock href, to be robust against trailing slashes added by JSDOM/browser
    expect(linkElement.href.startsWith(mockExternalItem.href)).toBe(true);
    // Or, if a strict match including a potential trailing slash is desired:
    // expect(linkElement.href).toBe(mockExternalItem.href.endsWith('/') ? mockExternalItem.href : mockExternalItem.href + '/');
    expect(linkElement.target).toBe("_blank");
    expect(linkElement.rel).toBe("noopener noreferrer");
  });

  it("shows tooltip with item name when collapsed (tooltip structure check)", () => {
    render(<NavItem item={mockItem} isCollapsed={true} mounted={true} />);
    expect(screen.getByTestId("tooltip-root")).toBeInTheDocument();
    // To fully test tooltip visibility requires hover events, which is more complex.
    // For now, we check if the tooltip content structure is rendered by our mock and contains the name.
    const tooltipContent = screen.getByTestId("tooltip-content");
    expect(tooltipContent).toBeInTheDocument();
    expect(tooltipContent).toHaveTextContent(mockItem.name);
  });
});
