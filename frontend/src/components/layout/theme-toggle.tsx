"use client";
import { useTheme } from "next-themes";
import { Laptop, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const options = [
  { value: "light", label: "Chế độ sáng", Icon: Sun },
  { value: "dark", label: "Chế độ tối", Icon: Moon },
  { value: "system", label: "Theo hệ thống", Icon: Laptop },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return (
    <div
      role="group"
      aria-label="Giao diện"
      className="border-line bg-surface inline-flex rounded-[var(--radius-sm)] border p-1"
    >
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={mounted && theme === value}
          onClick={() => setTheme(value)}
          className={`hover:bg-subtle inline-flex size-9 items-center justify-center rounded-md transition-colors ${mounted && theme === value ? "bg-subtle text-accent" : "text-muted"}`}
        >
          <Icon size={17} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
