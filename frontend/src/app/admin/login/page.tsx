import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Đăng nhập quản trị | DEVFOLIO",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16"
    >
      <p className="text-accent font-mono text-xs tracking-[.2em] uppercase">
        DEVFOLIO / ADMIN
      </p>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight">
        Đăng nhập quản trị
      </h1>
      <p className="text-muted mt-3">
        Chỉ tài khoản đã được cấp quyền mới có thể truy cập.
      </p>
      <LoginForm />
    </main>
  );
}
