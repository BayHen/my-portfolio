# Thiết lập FastAPI trên Windows

Yêu cầu Python 3.12+, Node.js 20.9+, npm và PostgreSQL. Backend hiện có trong `backend/`; không cần tạo ứng dụng mới. Dùng PowerShell tại gốc repository:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e '.[dev]'
Copy-Item .env.example .env
```

Điền `DATABASE_URL` và `CONTACT_HASH_SECRET` trong `backend/.env`. Không commit file này. Nếu dùng Docker, xem [database.md](database.md). Nếu dùng PostgreSQL cục bộ đã thiết lập trên máy này, xem [local-postgres-pgadmin.md](local-postgres-pgadmin.md). Chạy migration và API:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
$env:DEBUG = 'false'
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Mở `http://127.0.0.1:8000/api/docs`. Kiểm tra `GET /api/v1/health` và `GET /api/v1/health/db`. Lệnh phát triển: `python -m pytest -q`, `python -m ruff check app alembic tests`, `python -m ruff format --check app alembic tests`, `python -m alembic check`; dùng Python trong `.venv` cho tất cả lệnh. API không tự tạo bảng khi khởi động.

`APP_ENV=production` yêu cầu cookie quản trị bảo mật và `ADMIN_PROXY_TOKEN` dài tối thiểu 32 ký tự. `DEBUG` phải là `false`. Máy này từng có biến môi trường `DEBUG=release` từ công cụ khác; đặt `$env:DEBUG = 'false'` trước lệnh backend vì biến của tiến trình được ưu tiên hơn file `.env`. `CORS_ORIGINS` là mảng JSON các origin rõ ràng, ví dụ `["http://127.0.0.1:3000"]`; không dùng `*`. `FRONTEND_ORIGIN` vẫn được chấp nhận để tương thích cấu hình hiện tại.

Nếu `/health` thành công nhưng `/health/db` trả 503, kiểm tra PostgreSQL, cổng, `DATABASE_URL` và migration. Nếu `docker compose` báo thiếu mật khẩu, tạo `.env` tại gốc repository từ `.env.example` rồi thay mật khẩu mẫu. Nếu cổng 5435 bận, đổi `DEVFOLIO_DB_PORT` ở file đó và cổng trong `DATABASE_URL`.
