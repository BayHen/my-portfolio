import { ActionLink, Container } from "@/components/ui/primitives";
export default function NotFound() {
  return (
    <main id="main-content">
      <Container className="flex min-h-[60vh] flex-col items-start justify-center py-20">
        <p className="text-accent font-mono text-sm">404 / Not found</p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
          Không tìm thấy trang.
        </h1>
        <p className="text-muted mt-5 max-w-lg leading-7">
          Đường dẫn có thể đã thay đổi hoặc dự án không tồn tại.
        </p>
        <div className="mt-8">
          <ActionLink href="/">Về trang chủ</ActionLink>
        </div>
      </Container>
    </main>
  );
}
