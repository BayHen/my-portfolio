"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui/primitives";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.get("email"),
          password: values.get("password"),
        }),
      });
      if (response.status === 401)
        throw new Error("Email hoặc mật khẩu không đúng.");
      if (response.status === 429)
        throw new Error(
          "Đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.",
        );
      if (!response.ok)
        throw new Error("Không thể đăng nhập lúc này. Vui lòng thử lại sau.");
      router.replace("/admin");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đăng nhập.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="border-line bg-surface mt-8 space-y-5 rounded-[var(--radius-md)] border p-6 shadow-[var(--shadow)]"
    >
      <div>
        <label htmlFor="admin-email" className="mb-2 block text-sm font-medium">
          Email
        </label>
        <Input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label
          htmlFor="admin-password"
          className="mb-2 block text-sm font-medium"
        >
          Mật khẩu
        </label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <Button disabled={busy} type="submit" className="w-full">
        {busy ? "Đang đăng nhập…" : "Đăng nhập"}
      </Button>
    </form>
  );
}
