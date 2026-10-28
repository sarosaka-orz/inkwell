import { useMemo, useRef, useState } from "react";
import { useEditorStore } from "../../store/editorStore";
import { closeWindow } from "../../services/tauriBridge";
import { writeDrafts } from "../../services/draftStore";
import { saveDocument } from "../../services/documentActions";
import { Button } from "../ui";
import { ModalShell } from "../ui/ModalShell";

function closePendingTabs(tabIds: string[], closeWindowAfter: boolean) {
  const store = useEditorStore.getState();
  store.closeTabs(tabIds);
  store.dismissPendingClose();

  const next = useEditorStore.getState();
  writeDrafts(next.tabs, next.activeTabId);

  if (closeWindowAfter) void closeWindow();
}

export function CloseConfirmDialog() {
  const pendingClose = useEditorStore((s) => s.pendingClose);
  const tabs = useEditorStore((s) => s.tabs);
  const dismissPendingClose = useEditorStore((s) => s.dismissPendingClose);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [saving, setSaving] = useState(false);

  const affected = useMemo(
    () => (pendingClose ? tabs.filter((tab) => pendingClose.tabIds.includes(tab.id)) : []),
    [pendingClose, tabs],
  );

  if (!pendingClose) return null;

  const multiple = affected.length > 1;
  const description = multiple
    ? `${affected.length} documents have unsaved changes.`
    : `“${affected[0]?.name ?? "Untitled"}” has unsaved changes.`;

  const saveAndClose = async () => {
    setSaving(true);
    try {
      // Saving an untitled document can open a dialog; stop if it is cancelled.
      for (const tab of affected) {
        const saved = await saveDocument(tab.id);
        if (!saved) return;
      }
      closePendingTabs(
        affected.map((tab) => tab.id),
        pendingClose.closeWindow,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Save changes?"
      description={description}
      onClose={dismissPendingClose}
      initialFocusRef={cancelRef}
      size="sm"
      footer={
        <>
          <Button ref={cancelRef} variant="ghost" onClick={dismissPendingClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => closePendingTabs(affected.map((tab) => tab.id), pendingClose.closeWindow)}
            disabled={saving}
          >
            Don’t save
          </Button>
          <Button variant="primary" onClick={() => void saveAndClose()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <p className="text-[12px] leading-relaxed text-[var(--color-ink-soft)]">
        {pendingClose.closeWindow
          ? "Closing Inkwell will discard this work unless you save it first."
          : "This document will be closed. Save it first to keep your changes."}
      </p>
    </ModalShell>
  );
}
