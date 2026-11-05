# PostgreSQL cục bộ và pgAdmin

Máy phát triển hiện có server **DEVFOLIO Local** trong pgAdmin 4. Server kết nối tới PostgreSQL tại `127.0.0.1:5434`, database `devfolio_local`, role `devfolio_local`. Backend dùng cùng database qua `backend/.env`. Mật khẩu nằm trong file cục bộ `backend/.local-pg-dev-password`; các file này được Git bỏ qua. Không đưa mật khẩu lên repository.

Database đã chạy Alembic đến bản mới nhất và chứa 7 công nghệ mẫu. Các dự án và hồ sơ trong nguồn hiện là placeholder nên chưa được nhập. Trong pgAdmin, mở **Servers → DEVFOLIO Local → Databases → devfolio_local → Schemas → public → Tables** để xem các bảng.

PostgreSQL này chạy từ cluster cục bộ `backend/.local-pg-phase7-verify` trên cổng 5434. Nó không phải Windows service và có thể cần khởi động lại sau khi đăng xuất hoặc khởi động máy. Trong PowerShell tại thư mục gốc repository:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D 'backend\.local-pg-phase7-verify' -l 'backend\.local-pg-phase7-verify\server.log' start
```

Nếu pgAdmin hỏi lại mật khẩu, đọc file `backend/.local-pg-dev-password` trên máy. Không bật lưu mật khẩu nếu dùng máy chung. Server cũ trên cổng 5432 hiện phụ thuộc Windows service `postgresql-x64-18`, đang dừng; cấu hình mới trên cổng 5434 không cần service đó.

Để chạy FastAPI với database này, dùng các lệnh trong [hướng dẫn backend](backend.md) từ thư mục `backend/`. Kiểm tra `GET http://127.0.0.1:8000/api/v1/health` trước khi dùng API. Frontend chỉ đọc dữ liệu backend khi đặt `BACKEND_API_URL` trong `frontend/.env.local`; nếu chưa đặt, frontend tiếp tục dùng nội dung mẫu cục bộ.
