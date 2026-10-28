import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bold,
  ChevronDown,
  ChevronUp,
  Code,
  Highlighter,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Pin,
  PinOff,
  Quote,
  Sigma,
  Sparkles,
  Strikethrough,
  Table,
  Type,
} from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import {
  formatInline,
  formatLinePrefix,
  insertFencedBlock,
  insertImage,
  insertLink,
  insertMathBlock,
  insertText,
} from "../../services/editorController";
import { cn } from "../../lib/cn";

const LATCH_MS = 1200;

export function FormattingDock() {
  const selectedChars = useEditorStore((s) => s.cursorStats.selectedChars);
  const pinned = useEditorStore((s) => s.formatBarPinned);
  const togglePinned = useEditorStore((s) => s.toggleFormatBarPinned);
  const openOverlay = useEditorStore((s) => s.openOverlay);

  const [latched, setLatched] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const latchTimer = useRef<number | null>(null);

  const keepVisible = () => {
    setLatched(true);
    if (latchTimer.current) window.clearTimeout(latchTimer.current);
    if (!pinned) {
      latchTimer.current = window.setTimeout(() => setLatched(false), LATCH_MS);
    }
  };

  useEffect(() => {
    if (selectedChars > 0) {
      keepVisible();
    } else if (!pinned) {
      if (latchTimer.current) window.clearTimeout(latchTimer.current);
      latchTimer.current = window.setTimeout(() => setLatched(false), LATCH_MS);
    }
    return () => {
      if (latchTimer.current) window.clearTimeout(latchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChars, pinned]);

  const visible = pinned || selectedChars > 0 || latched;
  if (!visible) return null;

  const act = (action: () => void) => () => {
    action();
    keepVisible();
  };

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="fixed left-1/2 z-[var(--z-dock)] -translate-x-1/2 select-none animate-fade-up"
      style={{ bottom: "calc(var(--statusbar-h) + 14px)" }}
      onMouseDownCapture={(event) => event.preventDefault()}
    >
      <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-dock)]">
        <div className="flex items-center gap-0.5">
          <Tool icon={<Bold size={14} />} label="Bold (Ctrl+B)" onAct={act(() => formatInline("**", "bold text"))} />
          <Tool icon={<Italic size={14} />} label="Italic (Ctrl+I)" onAct={act(() => formatInline("*", "italic text"))} />
          <Tool icon={<Strikethrough size={14} />} label="Strikethrough" onAct={act(() => formatInline("~~", "strikethrough"))} />
          <Tool icon={<Code size={14} />} label="Inline code" onAct={act(() => formatInline("`", "code"))} />
          <Tool icon={<Highlighter size={14} />} label="Highlight" onAct={act(() => formatInline("==", "highlight"))} />

          <Divider />

          <Tool icon={<Link size={14} />} label="Link (Ctrl+K)" onAct={act(() => insertLink())} />
          <Tool icon={<List size={14} />} label="Bullet list" onAct={act(() => formatLinePrefix("- "))} />
          <Tool icon={<Quote size={14} />} label="Blockquote" onAct={act(() => formatLinePrefix("> "))} />

          <Divider />

          <Tool
            icon={expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            label={expanded ? "Fewer tools" : "More tools"}
            onAct={() => setExpanded((value) => !value)}
            active={expanded}
          />
          <Tool
            icon={pinned ? <PinOff size={14} /> : <Pin size={14} />}
            label={pinned ? "Unpin formatting tools" : "Pin formatting tools (Ctrl+Shift+F)"}
            onAct={togglePinned}
            active={pinned}
          />
        </div>

        {expanded && (
          <div className="mt-1 flex items-center gap-0.5 border-t border-[var(--color-line)] pt-1">
            <Tool icon={<Type size={14} />} label="Heading 1" onAct={act(() => formatLinePrefix("# "))} />
            <Tool icon={<Type size={13} />} label="Heading 2" onAct={act(() => formatLinePrefix("## "))} />
            <Tool icon={<Type size={12} />} label="Heading 3" onAct={act(() => formatLinePrefix("### "))} />

            <Divider />

            <Tool icon={<ListOrdered size={14} />} label="Numbered list" onAct={act(() => formatLinePrefix("1. "))} />
            <Tool icon={<ListTodo size={14} />} label="Task list" onAct={act(() => formatLinePrefix("- [ ] "))} />

            <Divider />

            <Tool icon={<Code size={14} />} label="Code block" onAct={act(() => insertFencedBlock("typescript"))} />
            <Tool icon={<Sigma size={14} />} label="Math block" onAct={act(insertMathBlock)} />
            <Tool
              icon={<Sparkles size={14} />}
              label="Mermaid diagram"
              onAct={act(() => insertFencedBlock("mermaid", "flowchart TD\n    A[Start] --> B[Finish]"))}
            />
            <Tool icon={<Table size={14} />} label="Insert table" onAct={act(() => openOverlay("table"))} />

            <Divider />

            <Tool icon={<Image size={14} />} label="Image" onAct={act(() => insertImage())} />
            <Tool icon={<Minus size={14} />} label="Divider" onAct={act(() => insertText("\n---\n"))} />
          </div>
        )}
      </div>
    </div>
  );
}

function Tool({
  icon,
  label,
  onAct,
  active = false,
}: {
  icon: ReactNode;
  label: string;
  onAct: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      onClick={onAct}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] transition-colors",
        active
          ? "bg-[var(--color-active)] text-[var(--color-accent)]"
          : "text-[var(--color-ink-soft)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]",
      )}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-4 w-px shrink-0 bg-[var(--color-line)]" aria-hidden />;
}
