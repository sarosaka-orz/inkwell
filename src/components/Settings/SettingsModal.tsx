import { useEditorStore, type Theme } from "../../store/editorStore";
import { themes } from "../../themes";
import { X } from "lucide-react";

export function SettingsModal() {
  const { settings, updateSettings, toggleSettings, theme, setTheme } = useEditorStore();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) toggleSettings();
      }}
    >
      <div
        className="w-full max-w-xl rounded-xl shadow-2xl border overflow-hidden"
        style={{
          background: "var(--color-bg-secondary)",
          borderColor: "var(--color-border)",
          animation: "fade-in-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Settings
          </h2>
          <button
            onClick={toggleSettings}
            className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-auto">
          {/* Theme */}
          <SettingGroup label="Theme">
            <div className="grid grid-cols-3 gap-2">
              {themes.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setTheme(t.name as Theme)}
                  className="px-3 py-2 rounded-lg text-xs border transition-all duration-200"
                  style={{
                    background: theme === t.name ? "var(--color-accent)" : "var(--color-bg-tertiary)",
                    borderColor: theme === t.name ? "var(--color-accent)" : "var(--color-border)",
                    color: theme === t.name ? "#000" : "var(--color-text-secondary)",
                    fontWeight: theme === t.name ? 600 : 400,
                    transform: theme === t.name ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </SettingGroup>

          {/* Font Family */}
          <SettingGroup label="Font Family">
            <select
              value={settings.fontFamily}
              onChange={(e) => updateSettings({ fontFamily: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm cursor-pointer"
              style={{
                background: "var(--color-bg-tertiary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            >
              <option value="JetBrains Mono">JetBrains Mono</option>
              <option value="Fira Code">Fira Code</option>
              <option value="Cascadia Code">Cascadia Code</option>
              <option value="iA Writer Quattro">iA Writer Quattro</option>
              <option value="Literata">Literata</option>
              <option value="Georgia">Georgia</option>
            </select>
          </SettingGroup>

          {/* Font Size */}
          <SettingGroup label={`Font Size: ${settings.fontSize}px`}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={12}
                max={24}
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                className="flex-1 accent-[var(--color-accent)]"
              />
              <span
                className="text-xs w-8 text-right tabular-nums"
                style={{ color: "var(--color-text-muted)" }}
              >
                {settings.fontSize}
              </span>
            </div>
          </SettingGroup>

          {/* Line Height */}
          <SettingGroup label={`Line Height: ${settings.lineHeight.toFixed(1)}`}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1.2}
                max={2.5}
                step={0.1}
                value={settings.lineHeight}
                onChange={(e) => updateSettings({ lineHeight: Number(e.target.value) })}
                className="flex-1 accent-[var(--color-accent)]"
              />
              <span
                className="text-xs w-8 text-right tabular-nums"
                style={{ color: "var(--color-text-muted)" }}
              >
                {settings.lineHeight.toFixed(1)}
              </span>
            </div>
          </SettingGroup>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <ToggleSetting
              label="Vim Mode"
              checked={settings.vimMode}
              onChange={(v) => updateSettings({ vimMode: v })}
            />
            <ToggleSetting
              label="Spell Check"
              checked={settings.spellCheck}
              onChange={(v) => updateSettings({ spellCheck: v })}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t text-right"
          style={{ borderColor: "var(--color-border)" }}
        >
          <button
            onClick={toggleSettings}
            className="px-4 py-1.5 rounded-lg text-sm transition-all duration-150 hover:opacity-80"
            style={{
              background: "var(--color-accent)",
              color: "var(--color-bg-primary)",
              fontWeight: 600,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block text-[13px] font-medium mb-2"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleSetting({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className="flex items-center gap-2.5 cursor-pointer px-3 py-2.5 rounded-lg border transition-all duration-150 hover:bg-[var(--color-bg-hover)]"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div
        className="relative w-9 h-5 rounded-full transition-colors duration-200"
        style={{ background: checked ? "var(--color-accent)" : "var(--color-bg-hover)" }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200"
          style={{
            background: checked ? "var(--color-bg-primary)" : "var(--color-text-muted)",
            transform: checked ? "translateX(16px)" : "translateX(0)",
          }}
        />
      </div>
      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </span>
    </label>
  );
}
