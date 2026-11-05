# Backend FastAPI và PostgreSQL

## Kiến trúc

`backend/app/api/v1` chứa HTTP handlers; `schemas` kiểm tra và định dạng dữ liệu; `repositories` truy vấn dữ liệu công khai; `services` xử lý liên hệ và nhập nội dung; `models` định nghĩa bảng; `db` quản lý phiên SQLAlchemy; `core` quản lý cấu hình và lỗi. Chỉ Alembic thay đổi schema khi chạy ứng dụng thật. API quản trị Phase 7 được mô tả riêng tại [admin.md](admin.md).

Các bảng gồm `projects`, `technologies`, `project_technologies`, `project_images`, `experiences`, `profile` và `contact_messages`. Dự án, hồ sơ và kinh nghiệm chỉ xuất hiện công khai khi có `published_at`. Bản nháp không được trả về từ API công khai.

## Chạy tại máy

Yêu cầu Python 3.12+ và PostgreSQL. Tạo database riêng, rồi chạy trong `backend/`:

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -e ".[dev]"
cp .env.example .env
```

Trên PowerShell dùng `Copy-Item .env.example .env`. Điền `DATABASE_URL` với URL `postgresql+psycopg://...` và `CONTACT_HASH_SECRET` ngẫu nhiên dài tối thiểu 24 ký tự. Không commit `.env`.

```bash
.venv/Scripts/python -m alembic upgrade head
.venv/Scripts/python -m uvicorn app.main:app --reload
```

API tại `http://127.0.0.1:8000/api/v1`; tài liệu OpenAPI tại `/api/docs`. Kiểm tra `GET /api/v1/health` để xác nhận cả kết nối database.

## API công khai

| Endpoint | Chức năng |
| --- | --- |
| `GET /api/v1/health` | Kiểm tra ứng dụng và database |
| `GET /api/v1/projects?limit=12&offset=0&technology=Python&featured=true` | Danh sách dự án đã xuất bản, phân trang và lọc |
| `GET /api/v1/projects/{slug}` | Chi tiết dự án đã xuất bản; 404 nếu thiếu hoặc còn nháp |
| `GET /api/v1/technologies?category=framework` | Công nghệ theo nhóm loại |
| `GET /api/v1/profile` | Hồ sơ đã xuất bản; 404 nếu chưa có |
| `GET /api/v1/experiences` | Kinh nghiệm đã xuất bản |
| `POST /api/v1/contact` | Lưu lời nhắn; cần header `Idempotency-Key` dài 16–100 ký tự |

Lỗi có mã và thông điệp an toàn, kèm request ID để đối chiếu log. Lời nhắn giới hạn độ dài, có trường bẫy `website`, giới hạn 5 lần mỗi IP trong một giờ, khóa idempotency để tránh lưu trùng. IP được băm bằng HMAC. Nếu đặt các biến `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` và `CONTACT_TO_EMAIL`, backend thử gửi thông báo qua Resend sau khi lưu. Trạng thái `notification` cho biết kết quả gửi; bản ghi đã lưu vẫn có thể tồn tại khi gửi thông báo thất bại. Chưa có hàng đợi gửi lại. Không có endpoint đọc lời nhắn công khai.

## Chuyển nội dung cục bộ

`backend/data/local-content.example.json` ánh xạ tên công nghệ, slug dự án và hồ sơ từ `frontend/src/content/`. Hai dự án và hồ sơ hiện là dữ liệu mẫu, có `placeholder: true`; bộ nhập bỏ qua chúng. Sao chép JSON sang file riêng, xác minh từng nội dung và đặt `placeholder: false` cho bản ghi thật. Chỉ đặt `publish: true` khi sẵn sàng công bố. Bản ghi mặc định là nháp.

```bash
.venv/Scripts/python -m app.services.import_content data/local-content.example.json
.venv/Scripts/python -m app.services.import_content path/to/verified-content.json --commit
```

Lệnh đầu chỉ thử và rollback. Lệnh `--commit` thực hiện trong một giao dịch: cập nhật công nghệ theo tên, dự án theo slug, hồ sơ theo ID cố định và kinh nghiệm theo vai trò/tổ chức/ngày bắt đầu. Không xóa bản ghi vắng mặt. Chạy lại không tạo trùng các khóa này. Kiểm tra số lượng ở kết quả lệnh và bằng API công khai, xem nội dung từng slug, rồi mới cân nhắc bỏ nguồn cục bộ. Nên sao lưu database trước khi nhập dữ liệu thật.

## Kết nối frontend

Đặt `BACKEND_API_URL` trong `frontend/.env.local`, ví dụ `http://127.0.0.1:8000`. Frontend dùng Server Components với cache 60 giây và timeout 5 giây. Khi biến này vắng mặt, frontend dùng nội dung mẫu tại `src/content/`. Khi đã cấu hình backend mà API lỗi, ứng dụng hiển thị lỗi hoặc trạng thái rỗng tương ứng, không lặng lẽ hiển thị dữ liệu mẫu như nội dung thật. Trang liên hệ vẫn dùng giao diện hiện có.

Để route Next.js `/api/contact` chuyển tiếp lời nhắn, đặt cùng giá trị `BACKEND_CONTACT_PROXY_TOKEN` ở frontend và `CONTACT_PROXY_TOKEN` ở backend. Chỉ backend tin header IP chuyển tiếp khi token khớp. Giữ token ở môi trường server, không dùng `NEXT_PUBLIC_`. Nếu chưa cấu hình token, route tiếp tục dùng cơ chế Resend trực tiếp của giai đoạn trước. Tránh bật cả hai đường gửi bằng cách chọn một đường vận hành và kiểm thử trước khi mở form.

Chỉ đặt `CONTENT_VERIFIED=true` khi đã kiểm tra nội dung và URL thật; cấu hình `SITE_URL` theo domain chính thức. Trạng thái SEO mặc định giữ `noindex` cho nội dung mẫu.

## Kiểm tra

Trong `backend/`: `python -m ruff check app alembic tests`, `python -m ruff format --check app alembic tests`, `python -m pytest -q`, `python -m alembic upgrade head`, `python -m alembic check`. Pytest dùng SQLite in-memory tách biệt; CI dùng thêm PostgreSQL riêng để kiểm tra migration. Không chạy test phá dữ liệu trên database phát triển hoặc production.

## Giới hạn vận hành

Phase 7 đã thêm xác thực quản trị, CRUD riêng tư và quản lý lời nhắn. Vẫn cần xác minh nội dung cá nhân, domain, email nhận liên hệ, chính sách lưu/xóa lời nhắn và chiến lược sao lưu database. Thông báo email hiện gửi đồng bộ; nếu lưu lượng tăng cần hàng đợi và cơ chế retry.
