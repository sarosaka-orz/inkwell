export const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

export function modKeyLabel(): string {
  return isMac ? "⌘" : "Ctrl";
}

/** Turn "Mod+Shift+F" into a platform-appropriate label. */
export function formatShortcut(shortcut: string): string {
  if (isMac) {
    return shortcut
      .replace(/Mod\+/g, "⌘")
      .replace(/Shift\+/g, "⇧")
      .replace(/Alt\+/g, "⌥")
      .replace(/Ctrl\+/g, "⌃");
  }
  return shortcut.replace(/Mod\+/g, "Ctrl+");
}
