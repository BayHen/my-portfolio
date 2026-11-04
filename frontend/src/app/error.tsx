"use client";
import Link from "next/link";
import { Container, Button } from "@/components/ui/primitives";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content">
      <Container className="flex min-h-[60vh] flex-col items-start justify-center py-20">
        <p className="text-accent font-mono text-sm">Error / Unexpected</p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
          Có lỗi xảy ra.
        </h1>
        <p className="text-muted mt-5 max-w-lg leading-7">
          Vui lòng thử tải lại nội dung hoặc quay về trang chủ.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={reset}>Thử lại</Button>
          <Link
            href="/"
            className="border-line bg-surface hover:bg-subtle inline-flex min-h-11 items-center rounded-[var(--radius-sm)] border px-5 text-sm font-semibold"
          >
            Về trang chủ
          </Link>
        </div>
      </Container>
    </main>
  );
}
