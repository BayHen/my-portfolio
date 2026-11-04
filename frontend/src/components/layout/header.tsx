"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { navigation } from "@/config/navigation";
import { Container, IconButton } from "@/components/ui/primitives";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);
  const active = (section: string) =>
    section === "home"
      ? pathname === "/"
      : pathname === `/${section}` || pathname.startsWith(`/${section}/`);
  return (
    <header className="border-line bg-canvas/95 sticky top-0 z-50 border-b backdrop-blur-md">
      <Container className="flex min-h-20 items-center justify-between gap-4">
        <Link
          href="/"
          className="text-ink shrink-0 text-lg font-bold tracking-[-.06em]"
          onClick={() => setOpen(false)}
        >
          DEVFOLIO<span className="text-accent">.</span>
        </Link>
        <nav
          aria-label="Điều hướng chính"
          className="hidden items-center gap-1 md:flex"
        >
          {navigation.map((item) => (
            <Link
              key={item.section}
              href={item.href}
              aria-current={active(item.section) ? "page" : undefined}
              className={`hover:bg-subtle hover:text-ink rounded-md px-3 py-2 text-sm font-medium transition-colors ${active(item.section) ? "text-accent" : "text-muted"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block">
          <ThemeToggle />
        </div>
        <IconButton
          label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="md:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </IconButton>
      </Container>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Điều hướng di động"
          className="border-line bg-canvas border-t md:hidden"
        >
          <Container className="flex flex-col gap-1 py-4">
            {navigation.map((item) => (
              <Link
                key={item.section}
                href={item.href}
                aria-current={active(item.section) ? "page" : undefined}
                onClick={() => {
                  setOpen(false);
                }}
                className={`hover:bg-subtle rounded-md px-3 py-3 text-base ${active(item.section) ? "text-accent" : "text-ink"}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 px-3">
              <ThemeToggle />
            </div>
          </Container>
        </nav>
      )}
    </header>
  );
}
