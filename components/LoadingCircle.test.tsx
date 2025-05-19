import React from "react"; // Import React if not already there
import { render, screen } from "@testing-library/react";
import LoadingCircle from "./LoadingCircle";

describe("LoadingCircle", () => {
  // const getSpinnerDiv = () => screen.getByRole('status').firstChild; // Removed unused function causing lint error

  it("renders with default props", () => {
    render(<LoadingCircle />);
    const spinner = screen.getByRole("status"); // The div itself can have a role
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("w-[4em] h-[4em]"); // Default size md
    expect(spinner).not.toHaveClass("animate-spin");
  });

  it("renders when isSpinning is true", () => {
    render(<LoadingCircle isSpinning={true} />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("animate-spin");
    expect(spinner).toHaveClass("border-t-transparent");
  });

  it("renders when isSpinning is false", () => {
    render(<LoadingCircle isSpinning={false} />);
    const spinner = screen.getByRole("status");
    expect(spinner).not.toHaveClass("animate-spin");
    expect(spinner).not.toHaveClass("border-t-transparent");
  });

  it("renders with xs size", () => {
    render(<LoadingCircle size="xs" />);
    expect(screen.getByRole("status")).toHaveClass("w-[0.8em] h-[0.8em]");
  });

  it("renders with sm size", () => {
    render(<LoadingCircle size="sm" />);
    expect(screen.getByRole("status")).toHaveClass("w-[1em] h-[1em]");
  });

  it("renders with lg size", () => {
    render(<LoadingCircle size="lg" />);
    expect(screen.getByRole("status")).toHaveClass("w-[8em] h-[8em]");
  });

  // Test that the component renders a div element which can be assigned a role for accessibility
  it("renders a div with role=status for accessibility", () => {
    render(<LoadingCircle />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
