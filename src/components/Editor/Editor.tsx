import { useEffect, useRef, type CSSProperties } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { FilePlus, FolderOpen, Search, Sparkles, PanelLeft } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { setGlobalEditorView } from "../../services/editorController";
import { openDocument } from "../../services/documentActions";
import { extractHeadings } from "../../utils/outline";
import { formatShortcut } from "../../lib/platform";
import {
  buildEditorExtensions,
  clearAutoSave,
  currentCompartmentEffects,
  modeCompartment,
  modeExtension,
  typographyCompartment,
  typographyExtension,
  vimCompartment,
  vimExtension,
} from "./extensions";
import { themeRefresh } from "./renderPlugin";
import { FindReplace } from "../Search/FindReplace";
import { Button, EmptyState, Kbd } from "../ui";

export function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const statesRef = useRef(new Map<string, EditorState>());
  const scrollRef = useRef(new Map<string, number>());
  const currentTabIdRef = useRef<string | null>(null);

  const activeTabId = useEditorStore((s) => s.activeTabId);
  const tabIds = useEditorStore((s) => s.tabs.map((tab) => tab.id).join("|"));
  const mode = useEditorStore((s) => s.mode);
  const vimMode = useEditorStore((s) => s.vimMode);
  const theme = useEditorStore((s) => s.theme);
  const settings = useEditorStore((s) => s.settings);
  const createNewFile = useEditorStore((s) => s.createNewFile);

  const hasActiveTab = useEditorStore((s) => Boolean(s.activeTabId));

  // Mount the single EditorView and swap per-tab EditorStates on tab change.
  useEffect(() => {
    if (!editorRef.current) return;

    const store = useEditorStore.getState();
    const tab = store.tabs.find((item) => item.id === store.activeTabId);

    if (!tab) {
      viewRef.current?.destroy();
      viewRef.current = null;
      setGlobalEditorView(null);
      currentTabIdRef.current = null;
      return;
    }

    let view = viewRef.current;

    if (!view) {
      const state = EditorState.create({
        doc: tab.content,
        extensions: buildEditorExtensions(tab.id),
      });
      statesRef.current.set(tab.id, state);
      view = new EditorView({ state, parent: editorRef.current });
      viewRef.current = view;
      currentTabIdRef.current = tab.id;
      setGlobalEditorView(view);
      store.setOutline(extractHeadings(tab.content));
      const initialSelection = state.selection.main;
      const initialLine = state.doc.lineAt(initialSelection.head);
      store.setCursorStats({
        line: initialLine.number,
        col: initialSelection.head - initialLine.from + 1,
        selectedChars: 0,
      });
      view.focus();
      return;
    }

    const previousId = currentTabIdRef.current;
    if (previousId === tab.id) return;

    if (previousId) {
      statesRef.current.set(previousId, view.state);
      scrollRef.current.set(previousId, view.scrollDOM.scrollTop);
    }

    const cached = statesRef.current.get(tab.id);
    const nextState = cached
      ? cached.update({ effects: currentCompartmentEffects() }).state
      : EditorState.create({
          doc: tab.content,
          extensions: buildEditorExtensions(tab.id),
        });

    statesRef.current.set(tab.id, nextState);
    view.setState(nextState);
    currentTabIdRef.current = tab.id;
    store.setOutline(extractHeadings(tab.content));

    const nextSelection = nextState.selection.main;
    const nextLine = nextState.doc.lineAt(nextSelection.head);
    store.setCursorStats({
      line: nextLine.number,
      col: nextSelection.head - nextLine.from + 1,
      selectedChars: Math.abs(nextSelection.to - nextSelection.from),
    });

    const scrollTop = scrollRef.current.get(tab.id) ?? 0;
    view.scrollDOM.scrollTop = scrollTop;
    view.focus();
  }, [activeTabId]);

  // Prune cached states for closed tabs.
  useEffect(() => {
    const ids = new Set(tabIds.split("|").filter(Boolean));
    for (const id of Array.from(statesRef.current.keys())) {
      if (!ids.has(id)) {
        statesRef.current.delete(id);
        scrollRef.current.delete(id);
        clearAutoSave(id);
      }
    }
  }, [tabIds]);

  // Reconfigure in place: theme, mode, Vim, and typography never reset undo.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: [
        modeCompartment.reconfigure(modeExtension(mode)),
        vimCompartment.reconfigure(vimExtension(vimMode)),
        typographyCompartment.reconfigure(typographyExtension(settings)),
        themeRefresh.of(null),
      ],
    });
  }, [
    mode,
    vimMode,
    theme,
    settings.fontFamily,
    settings.fontSize,
    settings.lineHeight,
  ]);

  useEffect(() => {
    return () => {
      clearAutoSave();
      viewRef.current?.destroy();
      viewRef.current = null;
      setGlobalEditorView(null);
    };
  }, []);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-paper)]">
      <FindReplace />

      {!hasActiveTab && (
        <EmptyState
          className="h-full pb-16"
          icon={<span className="font-document text-[19px] leading-none">✦</span>}
          title="A quiet page."
          description="Start something new, or open a file to keep writing where you left off."
          actions={
            <>
              <Button variant="primary" icon={<FilePlus size={14} />} onClick={createNewFile}>
                New document
              </Button>
              <Button icon={<FolderOpen size={14} />} onClick={openDocument}>
                Open file
              </Button>
            </>
          }
        >
          <div className="space-y-2 text-[11px] text-[var(--color-ink-muted)]">
            {[
              { label: "Command palette", keys: formatShortcut("Mod+P"), icon: Sparkles },
              { label: "Find and replace", keys: formatShortcut("Mod+F"), icon: Search },
              { label: "Toggle library", keys: formatShortcut("Mod+\\"), icon: PanelLeft },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <item.icon size={12} className="text-[var(--color-ink-muted)]" />
                  {item.label}
                </span>
                <Kbd>{item.keys}</Kbd>
              </div>
            ))}
          </div>
        </EmptyState>
      )}

      <div
        ref={editorRef}
        className={[
          "h-full min-h-0 flex-1 overflow-auto",
          mode === "source" ? "cm-source-mode" : "cm-live-mode",
          settings.typewriterMode ? "cm-typewriter-mode" : "",
          settings.focusMode ? "cm-focus-mode" : "",
          settings.fullWidth ? "cm-full-width" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          {
            display: hasActiveTab ? "block" : "none",
            "--editor-measure": settings.fullWidth ? "100%" : "68ch",
          } as CSSProperties
        }
      />
    </div>
  );
}
