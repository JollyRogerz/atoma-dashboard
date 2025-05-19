import "@testing-library/jest-dom";

// Mock ResizeObserver for Radix UI components in JSDOM
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
