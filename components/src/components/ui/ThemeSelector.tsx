import React from "react";

export type ThemeOption = {
  value: string;
  label: string;
  icon: string;
};

export function ThemeSelector({
  theme,
  setTheme,
  options,
}: {
  theme: string;
  setTheme: (theme: string) => void;
  options: ThemeOption[];
}) {
  return (
    <div className="relative">
      <select
        value={theme}
        onChange={e => setTheme(e.target.value)}
        className="appearance-none px-4 py-2 pr-8 rounded border border-table-border bg-table-header-bg text-table-header text-base font-medium shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
        style={{ minWidth: 120 }}
      >
        {options.map(t => (
          <option key={t.value} value={t.value} className="text-base">
            {t.icon} {t.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-table-header text-lg">▼</span>
    </div>
  );
}
