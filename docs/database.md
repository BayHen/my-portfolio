# PostgreSQL và migration

`compose.yaml` cung cấp PostgreSQL 17 cho phát triển với volume `devfolio_postgres_data`, health check và cổng chỉ bind vào `127.0.0.1`. Cấu hình Docker này độc lập với cluster PostgreSQL cục bộ trong [hướng dẫn pgAdmin](local-postgres-pgadmin.md).

Trong PowerShell tại gốc repository:

```powershell
Copy-Item .env.example .env
# Thay DEVFOLIO_DB_PASSWORD bằng mật khẩu riêng trong .env.
docker compose up -d postgres
docker compose ps
```

Mặc định Docker dùng database `devfolio_dev`, user `devfolio`, cổng máy `5435`. Cấu hình `backend/.env` bằng URL `postgresql+psycopg://devfolio:<password>@127.0.0.1:5435/devfolio_dev`; thay `<password>` bằng giá trị cục bộ và mã hóa URL nếu chứa ký tự đặc biệt. Chạy `backend/.venv/Scripts/python.exe -m alembic upgrade head` từ thư mục `backend/`. Dùng `docker compose stop` để dừng mà giữ dữ liệu. Không dùng `docker compose down -v` nếu muốn giữ dữ liệu.

Schema công khai gồm `projects`, `technologies`, `project_technologies`, `project_images`, `experiences`, `profile`, `contact_messages`. Migration Phase 7 còn có bảng quản trị riêng. Alembic là nguồn thay đổi schema; ứng dụng thật không gọi `Base.metadata.create_all()`.

Lệnh nhập mẫu từ `backend/`:

```powershell
.\.venv\Scripts\python.exe -m app.services.import_content data/local-content.example.json
.\.venv\Scripts\python.exe -m app.services.import_content data/local-content.example.json --commit
```

Lệnh đầu là dry run. File mẫu đánh dấu dự án và profile là placeholder nên importer bỏ qua chúng; chỉ công nghệ mẫu được thêm. Muốn nhập nội dung thật, tạo bản sao JSON đã xác minh, bỏ cờ placeholder và chỉ bật publish khi sẵn sàng. Import lặp lại không tạo trùng theo các khóa được mô tả trong [backend.md](backend.md). Không tự động seed khi production khởi động. Kiểm thử migration upgrade/downgrade chỉ được thực hiện trên database thử nghiệm riêng, không downgrade database có dữ liệu cần giữ.
