import { useRef, useState } from "react";
import { useEditorStore } from "../../store/editorStore";
import { insertTable } from "../../services/editorController";
import { Button, Field, ModalShell, inputClass } from "../ui";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? Math.round(value) : min));

export function InsertTableModal() {
  const closeOverlay = useEditorStore((s) => s.closeOverlay);
  const [columns, setColumns] = useState(3);
  const [rows, setRows] = useState(3);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    insertTable(rows, columns);
    closeOverlay();
  };

  return (
    <ModalShell
      title="Insert table"
      description="Choose a size, then fill in the cells in the editor."
      onClose={closeOverlay}
      size="sm"
      initialFocusRef={firstFieldRef}
      footer={
        <>
          <Button onClick={closeOverlay}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Insert table
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Columns" hint="1–12">
            <input
              ref={firstFieldRef}
              type="number"
              min={1}
              max={12}
              value={columns}
              onChange={(event) => setColumns(clamp(Number(event.target.value), 1, 12))}
              className={inputClass}
            />
          </Field>
          <Field label="Rows" hint="1–30">
            <input
              type="number"
              min={1}
              max={30}
              value={rows}
              onChange={(event) => setRows(clamp(Number(event.target.value), 1, 30))}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: rows * columns }).map((_, index) => (
              <span
                key={index}
                className="h-5 rounded-[var(--radius-xs)] border border-[var(--color-line)] bg-[var(--color-sunken)]"
              />
            ))}
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
          The first row becomes the header. Column count includes it.
        </p>
      </form>
    </ModalShell>
  );
}
