"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/primitives";
import { adminRequest } from "@/lib/admin-client";

const items = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/projects", label: "Dự án" },
  { href: "/admin/media", label: "Thư viện ảnh" },
  { href: "/admin/technologies", label: "Công nghệ" },
  { href: "/admin/experiences", label: "Kinh nghiệm" },
  { href: "/admin/messages", label: "Lời nhắn" },
  { href: "/admin/settings", label: "Hồ sơ" },
];

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const section =
    items.find((item) => item.href === pathname)?.label || "Quản trị";
  async function logout() {
    await adminRequest("/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <div
      data-admin-shell
      className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]"
    >
      <aside className="border-line bg-surface border-b p-5 lg:min-h-screen lg:border-r lg:border-b-0 lg:p-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin" className="text-lg font-bold tracking-[-.06em]">
            DEVFOLIO<span className="text-accent">.</span>
            <span className="text-muted ml-2 font-mono text-xs font-medium tracking-normal">
              ADMIN
            </span>
          </Link>
          <button
            className="border-line rounded-lg border px-3 py-2 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="admin-nav"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            Menu
          </button>
        </div>
        <nav
          id="admin-nav"
          aria-label="Điều hướng quản trị"
          className={`${menuOpen ? "flex" : "hidden"} mt-7 flex-col gap-1 lg:flex`}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`min-h-11 rounded-lg px-4 py-3 text-sm font-medium ${pathname === item.href ? "bg-subtle text-ink" : "text-muted hover:bg-subtle hover:text-ink"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-line mt-8 border-t pt-5 text-xs lg:mt-16">
          <p className="text-muted break-all">{email}</p>
          <Button variant="quiet" className="mt-3" onClick={logout}>
            Đăng xuất
          </Button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="border-line bg-canvas/90 sticky top-0 z-20 flex min-h-16 items-center justify-between border-b px-5 backdrop-blur sm:px-8">
          <p className="text-muted text-sm">
            Quản trị <span aria-hidden="true">/</span>{" "}
            <span className="text-ink font-medium">{section}</span>
          </p>
          <Link
            href="/"
            className="text-accent text-sm font-medium hover:underline"
          >
            Xem trang công khai
          </Link>
        </header>
        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
