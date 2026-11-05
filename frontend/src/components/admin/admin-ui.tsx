"use client";

import { useState } from "react";
import { Button, Input, Textarea } from "@/components/ui/primitives";

export function AdminHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <p className="text-accent mb-2 font-mono text-xs tracking-[.18em] uppercase">
        Workspace
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="text-muted mt-3 max-w-2xl">{description}</p>
    </div>
  );
}

export function Field({
  label,
  name,
  value,
  onChange,
  multiline = false,
  required = false,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      {multiline ? (
        <Textarea
          id={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={5}
          required={required}
        />
      ) : (
        <Input
          id={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          required={required}
        />
      )}
    </div>
  );
}

export function Notice({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  if (!message) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-lg border p-3 text-sm ${error ? "border-red-400 text-red-700 dark:text-red-300" : "border-line text-ink"}`}
    >
      {message}
    </p>
  );
}

export function ConfirmButton({
  label,
  confirmText,
  onConfirm,
  disabled = false,
}: {
  label: string;
  confirmText: string;
  onConfirm: () => Promise<void>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-flex items-center gap-2">
      {open ? (
        <>
          <span className="text-muted text-xs">{confirmText}</span>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={disabled}
            onClick={async () => {
              await onConfirm();
              setOpen(false);
            }}
          >
            {label}
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="quiet"
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
          {label}
        </Button>
      )}
    </span>
  );
}

export function AdminLoading() {
  return (
    <div role="status" className="border-line bg-surface rounded-xl border p-6">
      Đang tải dữ liệu…
    </div>
  );
}
