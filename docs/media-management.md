# Thư viện ảnh DEVFOLIO

Thư viện ảnh lưu metadata trong PostgreSQL (`media_assets`, `media_assignments`) và bytes ảnh ngoài database. Migration `7e41ac9f12d0` thêm hai bảng mà không xóa `project_images` cũ. Ảnh dự án cũ tiếp tục xuất hiện nếu chưa có bộ ảnh mới; giao diện quản trị mới dùng Media Library chung.

`media_assets` giữ UUID, khóa lưu trữ, backend lưu trữ, URL công khai, alt text, MIME đã xác minh, kích thước và thời điểm tạo. `media_assignments` gắn ảnh vào một slot toàn trang hoặc một dự án, với thứ tự cho gallery. Các slot: `hero_avatar`, `hero_background`, `about_profile`, `open_graph`, `project_thumbnail`, `project_gallery`. Ảnh `open_graph` được dùng cho metadata các trang công khai; trang chi tiết dự án ưu tiên thumbnail của dự án. Bản nháp dự án không xuất hiện trong API ảnh công khai.

Máy phát triển lưu bytes vào `backend/data/media/` (được Git bỏ qua). File có tên UUID, được giữ sau khi ứng dụng khởi động lại. Đặt `MEDIA_STORAGE_DIR` nếu muốn dùng ổ lưu trữ bền vững khác; sao lưu cả thư mục này lẫn PostgreSQL. `MEDIA_PUBLIC_BASE_URL` phải là origin backend mà trình duyệt truy cập được, ví dụ `http://127.0.0.1:8000`. File chưa gán không thể đọc qua endpoint công khai; admin có endpoint xem riêng.

Production yêu cầu `S3_BUCKET`, `S3_PUBLIC_BASE_URL` dùng HTTPS, credentials theo AWS SDK và `MEDIA_PUBLIC_BASE_URL` là HTTPS của backend. API công khai trả URL ổn định theo UUID; backend chuyển hướng đến object S3. Không dùng thư mục local như lưu trữ production. Khi chuyển từ local sang S3, cần sao chép file cũ và cập nhật metadata bằng quy trình di chuyển riêng trước khi tắt ổ local.

Ảnh tải lên giới hạn 5 MB, chỉ JPEG, PNG, WebP; Pillow kiểm tra nội dung thực và kích thước 100–6000 px mỗi chiều. Tên file đầu vào không dùng làm khóa lưu trữ. Không chấp nhận SVG/HTML. Chỉ admin có phiên và CSRF hợp lệ được upload, sửa, thay, gán hoặc xóa. Xóa ảnh đang được gán trả 409. Lỗi xóa object sau khi database đã commit có thể để lại object mồ côi; cần cơ chế dọn dẹp và giám sát trước production quy mô lớn.

API đọc: `GET /api/v1/media/assignments`, `GET /api/v1/media/files/{uuid}`. API admin (qua `/api/admin/media` của Next.js): `GET/POST /media`, `GET /media/assignments`, `GET /media/{id}`, `GET /media/{id}/file`, `PATCH/DELETE /media/{id}`, `PUT /media/{id}/file`, `PUT/DELETE /media/assignments/{slot}`, `PUT /media/projects/{project_id}/gallery`. Các thao tác admin thành công qua proxy Next.js gọi `revalidatePath` cho layout công khai; ghi trực tiếp vào FastAPI có thể cần đợi cache công khai tối đa khoảng 60 giây.
