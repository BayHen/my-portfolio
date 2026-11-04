# Quy trình Git

- `main`: bản ổn định, chỉ hợp nhất thay đổi đã kiểm tra.
- `develop`: nhánh tích hợp cho công việc đang phát triển.
- `feature/*`: tính năng mới, tạo từ `develop`.
- `fix/*`: sửa lỗi, tạo từ `develop`; có thể tạo từ `main` cho lỗi phát hành khẩn cấp.

Mỗi thay đổi đi qua pull request, mô tả phạm vi và kết quả `lint`, `typecheck`, `build`. Không ghi bí mật hoặc `.env.local` vào Git. Giai đoạn này không tạo nhánh phụ, commit hoặc thay đổi remote tự động.
