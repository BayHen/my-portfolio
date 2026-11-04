# DEVFOLIO

Nền tảng portfolio cá nhân cho lập trình viên Python Backend / Full-stack. Giai đoạn 1 thiết lập ứng dụng Next.js, dữ liệu nội dung cục bộ có kiểu rõ ràng và quy trình phát triển. Các thông tin cá nhân trong mã nguồn hiện là dữ liệu mẫu, không đại diện cho người thật.

## Chạy tại máy

Yêu cầu Node.js 20.9 trở lên và npm.

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Mở `http://localhost:3000`. Hiện chưa có biến môi trường bắt buộc. Trên PowerShell, có thể dùng `Copy-Item .env.example .env.local`; nếu chính sách thực thi chặn `npm.ps1`, dùng `npm.cmd`.

## Kiểm tra

Chạy trong `frontend/`: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run format:check`. Dùng `npm run format` để định dạng mã.

## Cấu trúc

- `frontend/`: ứng dụng Next.js App Router.
- `docs/`: yêu cầu, kiến trúc, lộ trình và quy trình Git.
- `devfolio/`: vị trí dành cho mã Python ở giai đoạn sau; hiện chỉ có tài liệu giữ chỗ.
- `.github/`: vị trí cho cấu hình cộng tác; chưa có workflow CI vì chưa xác định môi trường triển khai.

Giai đoạn 4 bổ sung chuyển động tiết chế, cấu trúc case study mở rộng và route gửi liên hệ qua Resend. Biểu mẫu chỉ bật khi máy chủ có cấu hình thật; việc phát thư chưa được xác minh. Xem [yêu cầu](docs/requirements.md), [kiến trúc](docs/architecture.md), [hệ thống thiết kế](docs/design-system.md), [trang công khai](docs/public-pages.md), [hướng dẫn Giai đoạn 4](docs/phase4.md), [lộ trình](docs/roadmap.md) và [quy trình Git](docs/git-workflow.md).
