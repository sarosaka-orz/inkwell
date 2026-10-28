// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useEditorStore, type Tab } from "./editorStore";

function tab(id: string, modified = false): Tab {
  return { id, path: `/docs/${id}.md`, name: `${id}.md`, content: id, modified };
}

beforeEach(() => {
  useEditorStore.setState({
    tabs: [tab("a"), tab("b"), tab("c", true)],
    activeTabId: "b",
    pendingClose: null,
    saveStatus: "saved",
  });
});

describe("close protection", () => {
  it("closes a clean tab immediately", () => {
    useEditorStore.getState().requestCloseTab("a");
    const state = useEditorStore.getState();
    expect(state.tabs.map((item) => item.id)).toEqual(["b", "c"]);
    expect(state.pendingClose).toBeNull();
  });

  it("asks before closing a modified tab", () => {
    useEditorStore.getState().requestCloseTab("c");
    const state = useEditorStore.getState();
    expect(state.tabs.map((item) => item.id)).toEqual(["a", "b", "c"]);
    expect(state.pendingClose).toEqual({ tabIds: ["c"], closeWindow: false });
  });

  it("only blocks the window when something is modified", () => {
    useEditorStore.setState({ tabs: [tab("a"), tab("b")] });
    expect(useEditorStore.getState().requestAppClose()).toBe(false);
    expect(useEditorStore.getState().pendingClose).toBeNull();

    useEditorStore.setState({ tabs: [tab("a"), tab("b", true)] });
    expect(useEditorStore.getState().requestAppClose()).toBe(true);
    expect(useEditorStore.getState().pendingClose).toEqual({
      tabIds: ["b"],
      closeWindow: true,
    });
  });

  it("dismisses the prompt without closing anything", () => {
    useEditorStore.getState().requestCloseTab("c");
    useEditorStore.getState().dismissPendingClose();
    expect(useEditorStore.getState().pendingClose).toBeNull();
    expect(useEditorStore.getState().tabs).toHaveLength(3);
  });
});

describe("closeTabs", () => {
  it("activates the tab to the right", () => {
    useEditorStore.getState().closeTabs(["b"]);
    expect(useEditorStore.getState().activeTabId).toBe("c");
  });

  it("falls back to the tab on the left", () => {
    useEditorStore.getState().closeTabs(["b", "c"]);
    expect(useEditorStore.getState().activeTabId).toBe("a");
  });

  it("keeps the active tab when another one closes", () => {
    useEditorStore.getState().closeTabs(["a"]);
    expect(useEditorStore.getState().activeTabId).toBe("b");
  });

  it("clears the active tab when everything closes", () => {
    useEditorStore.getState().closeTabs(["a", "b", "c"]);
    expect(useEditorStore.getState().activeTabId).toBeNull();
  });
});

describe("saving", () => {
  it("clears the modified flag", () => {
    useEditorStore.getState().markTabSaved("c");
    const saved = useEditorStore.getState().tabs.find((item) => item.id === "c");
    expect(saved?.modified).toBe(false);
    expect(useEditorStore.getState().saveStatus).toBe("saved");
  });
});
