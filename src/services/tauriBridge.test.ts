// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadFile, normalizeExternalUrl } from "./tauriBridge";

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

describe("downloadFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads through a blob link in the browser", async () => {
    const createObjectURL = vi.fn(() => "blob:inkwell");
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    await expect(downloadFile("notes.md", "# hi", "text/markdown")).resolves.toBe(true);

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:inkwell");
  });
});
