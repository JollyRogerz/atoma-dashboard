/// <reference types="@testing-library/jest-dom" />
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./sidebar"; // Import the main Sidebar component
import { useSettings } from "@/contexts/settings-context";
import { useMobile } from "@/hooks/use-mobile";

// Mock next/navigation
let mockPathname = "/";
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

// Mock useSettings context
jest.mock("@/contexts/settings-context", () => ({
  useSettings: jest.fn(),
}));

// Mock useMobile hook
jest.mock("@/hooks/use-mobile", () => ({
  useMobile: jest.fn(),
}));

// Mock NavItem to simplify Sidebar tests and focus on Sidebar logic
// We can check if NavItem receives correct props
jest.mock("@/components/NavItem", () => {
  const MockNavItem = ({ item, isCollapsed, mounted }: any) => (
    <div
      data-testid={`nav-item-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
      data-collapsed={isCollapsed}
      data-mounted={mounted}
    >
      {item.name}
    </div>
  );
  MockNavItem.displayName = "MockNavItem";
  return MockNavItem;
});

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { src, alt, width, height, priority, fill, quality, placeholder, style, className, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src as string}
        alt={alt as string}
        width={width}
        height={height}
        style={style}
        className={className}
        {...rest}
      />
    );
  },
}));

// Mock TooltipPrimitive provider as it's used at the root of Sidebar
jest.mock("@radix-ui/react-tooltip", () => ({
  ...jest.requireActual("@radix-ui/react-tooltip"), // Import and retain original exports
  Provider: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-provider">{children}</div>,
}));

describe("Sidebar", () => {
  let mockUseSettings: jest.Mock;
  let mockUseMobile: jest.Mock;

  beforeEach(() => {
    mockUseSettings = useSettings as jest.Mock;
    mockUseMobile = useMobile as jest.Mock;
    mockPathname = "/"; // Reset pathname
  });

  const renderSidebar = (loggedIn = false, isMobile = false) => {
    mockUseSettings.mockReturnValue({ settings: { loggedIn } });
    mockUseMobile.mockReturnValue(isMobile);
    return render(<Sidebar />);
  };

  it("renders navigation items correctly after mounting on desktop", async () => {
    renderSidebar(false, false); // Not logged in, desktop
    await screen.findByTestId("nav-item-network-status"); // Wait for NavItems to render (due to mounted state)

    expect(screen.getByTestId("nav-item-network-status")).toHaveTextContent("Network Status");
    expect(screen.getByTestId("nav-item-account-portal")).toHaveTextContent("Account Portal");
    expect(screen.getByTestId("nav-item-models")).toHaveTextContent("Models");
    expect(screen.getByTestId("nav-item-docs")).toHaveTextContent("Docs");
    expect(screen.queryByTestId("nav-item-settings")).not.toBeInTheDocument(); // Not logged in
  });

  it("renders Settings item when logged in on desktop", async () => {
    renderSidebar(true, false); // Logged in, desktop
    await screen.findByTestId("nav-item-settings");
    expect(screen.getByTestId("nav-item-settings")).toHaveTextContent("Settings");
  });

  it("toggles collapsed state on desktop via button", async () => {
    const user = userEvent.setup();
    renderSidebar(false, false); // Desktop
    await screen.findByTestId("nav-item-network-status");

    const collapseButton = screen.getAllByRole("button", { name: /Collapse Sidebar/i })[0]; // There are two, one for expanded, one for collapsed state icon change
    expect(screen.getByTestId("nav-item-network-status")).toHaveTextContent("Network Status"); // Initially expanded shows text

    await user.click(collapseButton);
    // In collapsed state, the text might be visually hidden by NavItem, our mock shows it.
    // We check the data-collapsed attribute passed to our mock NavItem.
    expect(screen.getByTestId("nav-item-network-status")).toHaveAttribute("data-collapsed", "true");

    const expandButton = screen.getAllByRole("button", { name: /Expand Sidebar/i })[0];
    await user.click(expandButton);
    expect(screen.getByTestId("nav-item-network-status")).toHaveAttribute("data-collapsed", "false");
  });

  it("toggles mobile sidebar with hamburger menu on mobile", async () => {
    const user = userEvent.setup();
    renderSidebar(false, true); // Mobile view
    await screen.findByTestId("nav-item-network-status");

    const hamburgerButton = screen.getByRole("button", { name: /Toggle sidebar/i });

    // eslint-disable-next-line testing-library/no-node-access
    let sidebarDiv = screen.getByTestId("nav-item-network-status").closest(".fixed.inset-y-0.z-10");
    expect(sidebarDiv).toHaveClass("-left-full");

    await user.click(hamburgerButton);
    // eslint-disable-next-line testing-library/no-node-access
    sidebarDiv = screen.getByTestId("nav-item-network-status").closest(".fixed.inset-y-0.z-10");
    expect(sidebarDiv).toHaveClass("left-0");

    await user.click(hamburgerButton);
    // eslint-disable-next-line testing-library/no-node-access
    sidebarDiv = screen.getByTestId("nav-item-network-status").closest(".fixed.inset-y-0.z-10");
    expect(sidebarDiv).toHaveClass("-left-full");
  });
});
