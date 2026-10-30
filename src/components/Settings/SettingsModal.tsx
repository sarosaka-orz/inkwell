import type { CSSProperties } from "react";
import { Keyboard, Palette, Sliders, Type } from "lucide-react";
import {
  useEditorStore,
  type FontChoice,
  type SettingsSection,
} from "../../store/editorStore";
import { themes } from "../../themes";
import { FONT_OPTIONS, resolveFontStack } from "../../themes/fonts";
import { formatShortcut } from "../../lib/platform";
import { isTauri } from "../../services/tauriBridge";
import { cn } from "../../lib/cn";
import { Button, Field, Kbd, ModalShell, Switch } from "../ui";

const SECTIONS: { id: SettingsSection; label: string; icon: typeof Palette }[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "typography", label: "Typography", icon: Type },
  { id: "editor", label: "Editor", icon: Sliders },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
];

const SHORTCUTS: { group: string; items: { keys: string; label: string }[] }[] = [
  {
    group: "File",
    items: [
      { keys: "Mod+N", label: "New document" },
      { keys: "Mod+O", label: "Open document" },
      { keys: "Mod+S", label: "Save" },
      { keys: "Mod+W", label: "Close tab" },
      { keys: "Mod+P", label: "Command palette" },
    ],
  },
  {
    group: "View",
    items: [
      { keys: "Mod+F", label: "Find and replace" },
      { keys: "Mod+/", label: "Toggle source mode" },
      { keys: "Mod+Shift+E", label: "Toggle read mode" },
      { keys: "Mod+-", label: "Zoom out" },
      { keys: "Mod+=", label: "Zoom in" },
      { keys: "Mod+0", label: "Reset zoom" },
      { keys: "Mod+\\", label: "Toggle library" },
      { keys: "Mod+,", label: "Settings" },
      { keys: "Mod+Shift+F", label: "Pin formatting tools" },
    ],
  },
  {
    group: "Formatting",
    items: [
      { keys: "Mod+B", label: "Bold" },
      { keys: "Mod+I", label: "Italic" },
      { keys: "Mod+K", label: "Link" },
      { keys: "Mod+1", label: "Heading 1" },
      { keys: "Mod+Z", label: "Undo" },
    ],
  },
];

export function SettingsModal() {
  const closeOverlay = useEditorStore((s) => s.closeOverlay);
  const section = useEditorStore((s) => s.settingsSection);
  const setSection = useEditorStore((s) => s.setSettingsSection);

  return (
    <ModalShell
      title="Settings"
      description="Tune the writing experience."
      onClose={closeOverlay}
      size="lg"
      bodyClassName="flex min-h-0 flex-1 overflow-hidden p-0"
      panelClassName="min-h-[440px]"
      footer={
        <Button variant="primary" onClick={closeOverlay}>
          Done
        </Button>
      }
    >
      <nav
        aria-label="Settings sections"
        className="flex w-44 shrink-0 flex-col gap-0.5 border-r border-[var(--color-line)] p-2"
      >
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              data-autofocus={active || undefined}
              onClick={() => setSection(item.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-[12px] transition-colors",
                active
                  ? "bg-[var(--color-active)] text-[var(--color-ink)]"
                  : "text-[var(--color-ink-soft)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]",
              )}
            >
              <Icon
                size={14}
                className={active ? "text-[var(--color-accent)]" : "text-[var(--color-ink-muted)]"}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {section === "appearance" && <AppearancePanel />}
        {section === "typography" && <TypographyPanel />}
        {section === "editor" && <EditorPanel />}
        {section === "shortcuts" && <ShortcutsPanel />}
      </div>
    </ModalShell>
  );
}

function PanelHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-[13px] font-semibold text-[var(--color-ink)]">{title}</h3>
      <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-ink-muted)]">{description}</p>
    </div>
  );
}

function AppearancePanel() {
  const theme = useEditorStore((s) => s.theme);
  const setTheme = useEditorStore((s) => s.setTheme);
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const desktop = isTauri();

  return (
    <div>
      <PanelHeading
        title="Theme"
        description="Palettes are made of ink, paper, and one accent color. They apply instantly."
      />
      <div className="grid grid-cols-2 gap-2.5">
        {themes.map((item) => {
          const active = theme === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setTheme(item.name)}
              aria-pressed={active}
              className={cn(
                "rounded-[var(--radius-md)] border p-1.5 text-left transition-colors",
                active
                  ? "border-[var(--color-accent)]"
                  : "border-[var(--color-line)] hover:border-[var(--color-ink-muted)]",
              )}
            >
              <div
                data-theme={item.name}
                data-scheme={item.isDark ? "dark" : "light"}
                className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-canvas)] p-3"
              >
                <div className="flex items-center gap-1.5">
                  {["--color-paper", "--color-sunken", "--color-accent", "--color-ink"].map(
                    (token) => (
                      <span
                        key={token}
                        className="h-4 w-4 rounded-full border border-[var(--color-line)]"
                        style={{ background: `var(${token})` }}
                      />
                    ),
                  )}
                  <span
                    className="ml-auto font-document text-[13px] text-[var(--color-ink)]"
                    style={{ lineHeight: 1 }}
                  >
                    Aa
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between px-1 pt-2 text-[11.5px]">
                <span className="text-[var(--color-ink)]">{item.label}</span>
                <span className="text-[10px] text-[var(--color-ink-muted)]">
                  {item.isDark ? "Dark" : "Light"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {desktop && (
        <div className="mt-8 border-t border-[var(--color-line)] pt-6">
          <PanelHeading
            title="Interface"
            description="Scale the whole window, including the toolbar and document. This is separate from the document type size."
          />
          <RangeControl
            label="Zoom"
            hint={`${Math.round(settings.zoom * 100)}%`}
            min={0.5}
            max={2}
            step={0.1}
            value={settings.zoom}
            onChange={(zoom) => updateSettings({ zoom })}
          />
        </div>
      )}
    </div>
  );
}

function TypographyPanel() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  return (
    <div className="space-y-6">
      <div>
        <PanelHeading
          title="Typography"
          description="Document type is separate from the interface. Changes apply to the editor immediately."
        />

        <Field label="Document typeface" hint={FONT_OPTIONS.find((f) => f.value === settings.fontFamily)?.note}>
          <select
            value={settings.fontFamily}
            onChange={(event) =>
              updateSettings({ fontFamily: event.target.value as FontChoice })
            }
            className="h-8 w-full rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-sunken)] px-2 text-[12px] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_2px_var(--color-accent-soft)]"
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </Field>

        <div
          className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-4"
          style={{
            fontFamily: resolveFontStack(settings.fontFamily),
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            color: "var(--color-ink)",
          }}
        >
          <div style={{ fontWeight: 650, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            The quiet page
          </div>
          <div
            style={{
              marginTop: "0.5em",
              color: "var(--color-ink-soft)",
              fontSize: "0.82em",
            }}
          >
            A good writing surface leaves room for the sentence to arrive.
          </div>
        </div>
      </div>

      <RangeControl
        label="Size"
        hint={`${settings.fontSize}px`}
        min={12}
        max={24}
        step={1}
        value={settings.fontSize}
        onChange={(fontSize) => updateSettings({ fontSize })}
      />

      <RangeControl
        label="Line height"
        hint={settings.lineHeight.toFixed(1)}
        min={1.3}
        max={2.4}
        step={0.1}
        value={settings.lineHeight}
        onChange={(lineHeight) => updateSettings({ lineHeight })}
      />
    </div>
  );
}

function RangeControl({
  label,
  hint,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <Field label={label} hint={hint}>
      <input
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={
          {
            "--range-fill": `linear-gradient(to right, var(--color-accent) ${percent}%, var(--color-line) ${percent}%)`,
          } as CSSProperties
        }
      />
    </Field>
  );
}

function EditorPanel() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  return (
    <div>
      <PanelHeading
        title="Editor"
        description="Writing behavior and layout. These settings are remembered between sessions."
      />
      <div className="divide-y divide-[var(--color-line)]">
        <Switch
          checked={settings.autoSave}
          onChange={(autoSave) => updateSettings({ autoSave })}
          label="Auto-save"
          description="Save files that already have a location as you type."
        />
        <Switch
          checked={settings.focusMode}
          onChange={(focusMode) => updateSettings({ focusMode })}
          label="Focus mode"
          description="Dim every line except the one you are writing."
        />
        <Switch
          checked={settings.typewriterMode}
          onChange={(typewriterMode) => updateSettings({ typewriterMode })}
          label="Typewriter scrolling"
          description="Keep the current line vertically centered."
        />
        <Switch
          checked={settings.fullWidth}
          onChange={(fullWidth) => updateSettings({ fullWidth })}
          label="Full width"
          description="Use the whole window instead of a comfortable reading measure."
        />
        <Switch
          checked={settings.vimMode}
          onChange={(vimMode) => updateSettings({ vimMode })}
          label="Vim mode"
          description="Normal, insert, and visual modes in the editor."
        />
        <Switch
          checked={settings.smoothCaret}
          onChange={(smoothCaret) => updateSettings({ smoothCaret })}
          label="Smooth caret"
          description="Glide the caret between positions instead of jumping."
        />
      </div>
    </div>
  );
}

function ShortcutsPanel() {
  return (
    <div className="space-y-6">
      <PanelHeading
        title="Keyboard shortcuts"
        description="Every action is also available from the command palette."
      />
      {SHORTCUTS.map((group) => (
        <section key={group.group}>
          <h4 className="mb-2 text-[11px] font-medium text-[var(--color-ink-muted)]">
            {group.group}
          </h4>
          <div className="divide-y divide-[var(--color-line)] rounded-[var(--radius-md)] border border-[var(--color-line)]">
            {group.items.map((item) => (
              <div
                key={item.keys}
                className="flex items-center justify-between px-3 py-2 text-[12px]"
              >
                <span className="text-[var(--color-ink-soft)]">{item.label}</span>
                <Kbd>{formatShortcut(item.keys)}</Kbd>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
