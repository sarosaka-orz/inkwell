import { describe, expect, it } from "vitest";
import { bestScore, fuzzyScore } from "./score";

describe("fuzzyScore", () => {
  it("matches subsequences case-insensitively", () => {
    expect(fuzzyScore("cp", "Command Palette")).not.toBeNull();
    expect(fuzzyScore("zzz", "Command Palette")).toBeNull();
  });

  it("scores consecutive matches higher than scattered ones", () => {
    const consecutive = fuzzyScore("com", "Command Palette")!;
    const scattered = fuzzyScore("com", "C O M")!;
    expect(consecutive).toBeGreaterThan(scattered);
  });

  it("treats an empty query as a match", () => {
    expect(fuzzyScore("   ", "anything")).toBe(0);
  });
});

describe("bestScore", () => {
  it("keeps the highest score across fields", () => {
    const title = fuzzyScore("pal", "Command Palette")!;
    expect(bestScore("pal", "Something else", "Command Palette")).toBe(title);
  });

  it("returns null when nothing matches", () => {
    expect(bestScore("zzz", "one", undefined, "two")).toBeNull();
  });
});
