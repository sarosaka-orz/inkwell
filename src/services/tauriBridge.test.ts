import { describe, expect, it } from "vitest";
import { normalizeExternalUrl } from "./tauriBridge";

describe("normalizeExternalUrl", () => {
  it("accepts web and mail links", () => {
    expect(normalizeExternalUrl("https://example.com/a?b=1")).toBe("https://example.com/a?b=1");
    expect(normalizeExternalUrl("http://example.com")).toBe("http://example.com/");
    expect(normalizeExternalUrl("mailto:writer@example.com")).toBe("mailto:writer@example.com");
  });

  it("rejects scripts, file paths and relative links", () => {
    expect(normalizeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeExternalUrl("file:///etc/passwd")).toBeNull();
    expect(normalizeExternalUrl("#heading")).toBeNull();
    expect(normalizeExternalUrl("./notes/other.md")).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(normalizeExternalUrl("https://")).toBeNull();
    expect(normalizeExternalUrl("")).toBeNull();
  });
});
