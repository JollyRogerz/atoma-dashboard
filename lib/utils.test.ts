import { simplifyModelName, formatNumber } from "./utils";
import { ModelModality } from "../lib/atoma-types";
import { modalityToFeatureName } from "./utils";
import { cn } from "./utils";

describe("simplifyModelName", () => {
  it("should remove vendor prefix and replace hyphens", () => {
    expect(simplifyModelName("Qwen/QwQ-32B")).toBe("QwQ 32B");
  });

  it("should replace hyphens in complex names", () => {
    expect(simplifyModelName("meta-llama/Llama-3.1-8B-Instruct")).toBe("Llama 3.1 8B Instruct");
  });

  it("should handle names without vendor prefixes correctly", () => {
    expect(simplifyModelName("DeepSeek-V3-0324")).toBe("DeepSeek V3 0324");
  });

  it("should return an empty string for an empty input", () => {
    expect(simplifyModelName("")).toBe("");
  });

  it("should handle already simplified names", () => {
    expect(simplifyModelName("QwQ 32B")).toBe("QwQ 32B");
  });
});

describe("formatNumber", () => {
  it("should return empty string for undefined input", () => {
    expect(formatNumber(undefined)).toBe("");
  });

  it("should format numbers less than 1000 as is", () => {
    expect(formatNumber(123)).toBe("123");
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
  });

  it("should format thousands with K", () => {
    expect(formatNumber(1000)).toBe("1K");
    expect(formatNumber(1234)).toBe("1.2K");
    expect(formatNumber(999999)).toBe("1000K"); // Or adjust based on desired precision, current is 999.9K -> 1000K due to toFixed(1) then replace .0
  });

  it("should format millions with M", () => {
    expect(formatNumber(1000000)).toBe("1M");
    expect(formatNumber(1234567)).toBe("1.2M");
    expect(formatNumber(999999999)).toBe("1000M");
  });

  it("should format billions with B", () => {
    expect(formatNumber(1000000000)).toBe("1B");
    expect(formatNumber(1234567890)).toBe("1.2B");
  });

  it("should format decimal numbers with two decimal places", () => {
    expect(formatNumber(123.456)).toBe("123.46");
    expect(formatNumber(0.1)).toBe("0.10");
    expect(formatNumber(99.005)).toBe("99.00");
  });

  it("should handle numbers that result in .0K, .0M, .0B correctly", () => {
    expect(formatNumber(2000)).toBe("2K");
    expect(formatNumber(3000000)).toBe("3M");
    expect(formatNumber(4000000000)).toBe("4B");
  });
});

describe("modalityToFeatureName", () => {
  it("should return correct feature name for ChatCompletions", () => {
    expect(modalityToFeatureName(ModelModality.ChatCompletions)).toBe("Chat Completion");
  });

  it("should return correct feature name for ImagesGenerations", () => {
    expect(modalityToFeatureName(ModelModality.ImagesGenerations)).toBe("Image Generation");
  });

  it("should return correct feature name for Embeddings", () => {
    expect(modalityToFeatureName(ModelModality.Embeddings)).toBe("Embedding");
  });

  it("should return the input string if modality is not in enum (or cast as any)", () => {
    // This tests the default case of the switch statement
    expect(modalityToFeatureName("UnknownModality" as any)).toBe("UnknownModality");
  });
});

describe("cn", () => {
  it("should combine basic strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes with objects", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("should handle mixed arrays and objects", () => {
    expect(cn("a", ["b", { c: true, d: false }], "e")).toBe("a b c e");
  });

  it("should filter out falsy values", () => {
    expect(cn("a", null, "b", undefined, "c", 0, "d", false, "e")).toBe("a b c d e");
  });

  // tailwind-merge specific test: last conflicting class should win
  it("should merge tailwind classes correctly (last one wins for conflicts)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("px-4 py-2", "p-3")).toBe("p-3"); // p-3 overrides both px and py
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});
