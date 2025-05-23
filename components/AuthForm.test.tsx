/// <reference types="@testing-library/jest-dom" />
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "./AuthForm";
import { useSettings } from "@/contexts/settings-context";
import * as api from "@/lib/api";
import { toast } from "sonner";

// Mock dependencies
jest.mock("@/contexts/settings-context", () => ({
  useSettings: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  loginUser: jest.fn(),
  registerUser: jest.fn(),
}));

// Mock ZkLogin dynamic import and class behavior
const mockZkLoginInstance = {
  initialize: jest.fn().mockResolvedValue(undefined),
  getURL: jest.fn().mockResolvedValue("https://mocked.google.oauth.url"),
};
const mockZkLoginModule = {
  __esModule: true, // This is important for ES modules
  default: jest.fn(() => mockZkLoginInstance),
};
jest.mock("@/lib/zklogin", () => mockZkLoginModule);

jest.mock("sonner", () => ({
  toast: jest.fn(),
}));

// Mock window.location.href for Google OAuth redirect
const originalLocation = window.location;

beforeAll(() => {
  // More robust way to mock window.location.href for testing redirects
  Object.defineProperty(window, "location", {
    configurable: true,
    enumerable: true,
    value: { ...originalLocation, href: "" }, // Initialize with a writable href
    writable: true,
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    // Restore original location object
    configurable: true,
    enumerable: true,
    value: originalLocation,
    writable: true,
  });
});

describe("AuthForm", () => {
  const mockOnClose = jest.fn();
  const mockUpdateSettings = jest.fn();
  const mockUpdateZkLoginSettings = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSettings as jest.Mock).mockReturnValue({
      settings: { zkLogin: { isEnabled: true } }, // Default settings mock
      updateSettings: mockUpdateSettings,
      updateZkLoginSettings: mockUpdateZkLoginSettings,
    });
    window.location.href = ""; // Now this should work as href is part of the mocked value and writable
  });

  it('renders login form by default or when type is "login"', () => {
    render(<AuthForm type="login" onClose={mockOnClose} />);
    expect(screen.getByRole("heading", { name: /Enter your credentials/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByText(/Forgot password?/i)).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account?/i)).toBeInTheDocument();
  });

  it('renders register form when type is "register"', () => {
    render(<AuthForm type="register" onClose={mockOnClose} />);
    expect(screen.getByRole("heading", { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.queryByText(/Forgot password?/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Already have an account?/i)).toBeInTheDocument();
  });

  it("allows typing in email and password fields", async () => {
    const user = userEvent.setup();
    render(<AuthForm type="login" onClose={mockOnClose} />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  it("calls loginUser on form submission in login mode and updates settings", async () => {
    const user = userEvent.setup();
    (api.loginUser as jest.Mock).mockResolvedValue({ data: { access_token: "fake_token" } });
    render(<AuthForm type="login" onClose={mockOnClose} />);

    await user.type(screen.getByLabelText(/Email/i), "test@example.com");
    await user.type(screen.getByLabelText(/Password/i), "password123");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));

    expect(api.loginUser).toHaveBeenCalledWith("test@example.com", "password123");
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalledWith({ accessToken: "fake_token", loggedIn: true }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Success", { description: "Login successful!" }));
    await waitFor(() => expect(mockOnClose).toHaveBeenCalled());
  });

  it("calls registerUser on form submission in register mode and updates settings", async () => {
    const user = userEvent.setup();
    (api.registerUser as jest.Mock).mockResolvedValue({ data: { access_token: "fake_token" } });
    render(<AuthForm type="register" onClose={mockOnClose} />);

    await user.type(screen.getByLabelText(/Email/i), "new@example.com");
    await user.type(screen.getByLabelText(/Password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /Create Account/i }));

    expect(api.registerUser).toHaveBeenCalledWith({ email: "new@example.com" }, "newpassword123");
    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalledWith({ accessToken: "fake_token", loggedIn: true }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Success", { description: "Login successful!" }));
    await waitFor(() => expect(mockOnClose).toHaveBeenCalled());
  });

  it("shows error toast on loginUser failure", async () => {
    const user = userEvent.setup();
    (api.loginUser as jest.Mock).mockRejectedValue({ response: { status: 401, data: { message: "Bad creds" } } });
    render(<AuthForm type="login" onClose={mockOnClose} />);

    await user.type(screen.getByLabelText(/Email/i), "test@example.com");
    await user.type(screen.getByLabelText(/Password/i), "password123");
    await user.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith("Error", { description: "Bad request. Please check your credentials." })
    );
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("switches between login and register views", async () => {
    const user = userEvent.setup();
    render(<AuthForm type="login" onClose={mockOnClose} />);
    expect(screen.getByRole("heading", { name: /Enter your credentials/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Sign up/i }));
    expect(screen.getByRole("heading", { name: /Create Account/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Sign in/i }));
    expect(screen.getByRole("heading", { name: /Enter your credentials/i })).toBeInTheDocument();
  });

  describe("Google OAuth", () => {
    // Mock NEXT_PUBLIC_ENABLE_ZK_LOGIN_GOOGLE for these tests
    const originalEnv = process.env;
    beforeEach(() => {
      jest.resetModules(); // Clears module cache for process.env changes
      process.env = { ...originalEnv, NEXT_PUBLIC_ENABLE_ZK_LOGIN_GOOGLE: "true" };
    });
    afterEach(() => {
      process.env = originalEnv;
    });

    it("renders Google OAuth button if env var is true", () => {
      render(<AuthForm type="login" onClose={mockOnClose} />);
      expect(screen.getByRole("button", { name: /Continue with Google/i })).toBeInTheDocument();
    });

    it("calls handleGoogleOauth and redirects when Google button is clicked", async () => {
      const user = userEvent.setup();
      render(<AuthForm type="login" onClose={mockOnClose} />);
      await user.click(screen.getByRole("button", { name: /Continue with Google/i }));

      await waitFor(() => expect(mockZkLoginInstance.initialize).toHaveBeenCalled());
      await waitFor(() => expect(mockZkLoginInstance.getURL).toHaveBeenCalled());
      await waitFor(() => expect(window.location.href).toBe("https://mocked.google.oauth.url"));
    });

    it("shows error toast if ZkLogin getURL fails", async () => {
      const user = userEvent.setup();
      mockZkLoginInstance.getURL.mockRejectedValue(new Error("ZkLogin failed"));
      render(<AuthForm type="login" onClose={mockOnClose} />);

      await user.click(screen.getByRole("button", { name: /Continue with Google/i }));

      await waitFor(() =>
        expect(toast).toHaveBeenCalledWith("Error", { description: "Failed to initiate Google login." })
      );
    });
  });

  it("does not render Google OAuth button if env var is not true", () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, NEXT_PUBLIC_ENABLE_ZK_LOGIN_GOOGLE: "false" };
    render(<AuthForm type="login" onClose={mockOnClose} />);
    expect(screen.queryByRole("button", { name: /Continue with Google/i })).not.toBeInTheDocument();
    process.env = originalEnv; // Restore original env
  });
});
