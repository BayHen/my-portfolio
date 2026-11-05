# DEVFOLIO

Thư viện ảnh tập trung đã có tại `/admin/media`. Xem [quản lý ảnh](docs/media-management.md), [hướng dẫn admin](docs/admin-media.md) và [sửa hydration](docs/hydration-fix.md). Ảnh phát triển được lưu ở `backend/data/media/`, metadata ở PostgreSQL; production dùng S3. Chạy `cd backend` và `.\.venv\Scripts\python.exe -m alembic upgrade head` trước khi dùng chức năng ảnh.

## Backend và frontend cục bộ

Backend FastAPI đã có tại `backend/`, PostgreSQL có thể chạy bằng `compose.yaml` hoặc cluster cục bộ. Xem [thiết lập backend](docs/backend-setup.md), [database](docs/database.md), [API](docs/api.md) và [kết nối frontend](docs/frontend-backend-integration.md). Cấu hình `BACKEND_API_URL` ở `frontend/.env.local` để Next.js đọc dữ liệu backend; khi để trống, trang dùng nội dung mẫu cục bộ. Dự án và hồ sơ mẫu chưa được nhập vào database như dữ liệu thật.

Trên PowerShell, tạo `.env` ở gốc từ `.env.example`, thay `DEVFOLIO_DB_PASSWORD`, rồi chạy `docker compose up -d postgres`. Tạo `backend/.env` từ `backend/.env.example` và đặt `DATABASE_URL`, `CONTACT_HASH_SECRET`; chạy migration trước khi mở API bằng `uvicorn`. Cổng Docker mặc định là `5435`, tách biệt PostgreSQL cục bộ cổng `5434` đã cấu hình cho pgAdmin.

Quản trị nội dung Phase 7: xem [docs/admin.md](docs/admin.md) để thiết lập tài khoản, phiên đăng nhập, lưu ảnh và chạy dashboard. Không có đăng ký quản trị công khai.

Giai đoạn 6 bổ sung FastAPI và PostgreSQL trong `backend/`. Xem [hướng dẫn backend](docs/backend.md) để cấu hình cơ sở dữ liệu, chạy migration, nhập nội dung đã xác minh và kết nối frontend. Khi chưa cấu hình `BACKEND_API_URL`, frontend tiếp tục dùng dữ liệu mẫu cục bộ.

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
