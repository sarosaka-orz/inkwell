// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { DRAFT_STORAGE_KEY, clearDrafts, readDraft, writeDrafts } from "./draftStore";

const clean = { id: "a", path: "/a.md", name: "a.md", content: "saved", modified: false };
const dirty = { id: "b", path: "", name: "b.md", content: "unsaved", modified: true };

beforeEach(() => {
  localStorage.clear();
});

describe("draftStore", () => {
  it("persists only dirty tabs", () => {
    writeDrafts([clean, dirty], "b");
    const draft = readDraft();
    expect(draft?.tabs).toEqual([{ id: "b", path: "", name: "b.md", content: "unsaved" }]);
    expect(draft?.activeTabId).toBe("b");
  });

  it("clears the draft when everything is saved", () => {
    writeDrafts([dirty], "b");
    writeDrafts([{ ...dirty, modified: false }], "b");
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    expect(readDraft()).toBeNull();
  });

  it("ignores malformed sessions", () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, "{not json");
    expect(readDraft()).toBeNull();

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ tabs: [{ id: 1 }] }));
    expect(readDraft()).toBeNull();
  });

  it("falls back to the first tab when the active id is unknown", () => {
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        tabs: [{ id: "x", path: "", name: "x.md", content: "x" }],
        activeTabId: "missing",
      }),
    );
    expect(readDraft()?.activeTabId).toBe("x");
  });

  it("can be cleared explicitly", () => {
    writeDrafts([dirty], "b");
    clearDrafts();
    expect(readDraft()).toBeNull();
  });
});
