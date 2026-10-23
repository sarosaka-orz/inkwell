import { useEffect, useRef, useState } from "react";
import { CaseSensitive, ChevronDown, ChevronUp, Regex, Replace, Search, X } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import {
  doReplaceAll,
  doReplaceNext,
  executeSearch,
  getGlobalEditorView,
  searchNext,
  searchPrevious,
} from "../../services/editorController";
import { cn } from "../../lib/cn";
import { Button, IconButton } from "../ui";

export function FindReplace() {
  const searchOpen = useEditorStore((s) => s.searchOpen);
  const setSearchOpen = useEditorStore((s) => s.setSearchOpen);
  const preview = useEditorStore((s) => s.mode === "preview");

  const [query, setQuery] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (searchOpen) {
      wasOpenRef.current = true;
      inputRef.current?.focus();
      inputRef.current?.select();
      return;
    }

    executeSearch("");
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      getGlobalEditorView()?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    try {
      setMatchCount(query ? executeSearch(query, caseSensitive, useRegex) : null);
    } catch {
      setMatchCount(null);
    }
  }, [query, caseSensitive, useRegex, searchOpen]);

  if (!searchOpen) return null;

  return (
    <div
      className="absolute right-3 top-3 z-40 flex w-[min(432px,calc(100%-1.5rem))] flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-dock)] animate-fade-up"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          setSearchOpen(false);
        }
      }}
    >
      <div className="flex items-center gap-1">
        <div className="input-shell flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-xs)] border border-transparent bg-[var(--color-sunken)] px-2 py-1.5">
          <Search size={12} className="shrink-0 text-[var(--color-accent)]" />
          <input
            ref={inputRef}
            value={query}
            placeholder="Find in document…"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (event.shiftKey) searchPrevious();
                else searchNext();
              } else if (event.key === "Escape") {
                event.preventDefault();
                setSearchOpen(false);
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-muted)]"
          />
          {matchCount !== null && (
            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-px text-[9.5px] tabular-nums",
                matchCount > 0
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                  : "bg-[var(--color-sunken)] text-[var(--color-danger)]",
              )}
            >
              {matchCount}
            </span>
          )}
        </div>

        <IconButton
          label="Match case"
          size="sm"
          active={caseSensitive}
          icon={<CaseSensitive size={14} />}
          onClick={() => setCaseSensitive((value) => !value)}
        />
        <IconButton
          label="Regular expression"
          size="sm"
          active={useRegex}
          icon={<Regex size={14} />}
          onClick={() => setUseRegex((value) => !value)}
        />
        <IconButton label="Previous match" size="sm" icon={<ChevronUp size={14} />} onClick={searchPrevious} />
        <IconButton label="Next match" size="sm" icon={<ChevronDown size={14} />} onClick={searchNext} />
        {!preview && (
          <IconButton
            label="Toggle replace"
            size="sm"
            active={showReplace}
            icon={<Replace size={14} />}
            onClick={() => setShowReplace((value) => !value)}
          />
        )}
        <IconButton
          label="Close search"
          size="sm"
          icon={<X size={14} />}
          onClick={() => setSearchOpen(false)}
        />
      </div>

      {showReplace && !preview && (
        <div className="flex items-center gap-1.5 border-t border-[var(--color-line-soft)] pt-1.5">
          <div className="input-shell flex min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-xs)] border border-transparent bg-[var(--color-sunken)] px-2 py-1.5">
            <Replace size={12} className="shrink-0 text-[var(--color-ink-muted)]" />
            <input
              value={replaceText}
              placeholder="Replace with…"
              onChange={(event) => setReplaceText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  doReplaceNext(replaceText);
                }
              }}
              className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-muted)]"
            />
          </div>
          <Button size="sm" onClick={() => doReplaceNext(replaceText)}>
            Replace
          </Button>
          <Button size="sm" variant="primary" onClick={() => doReplaceAll(replaceText)}>
            All
          </Button>
        </div>
      )}
    </div>
  );
}
