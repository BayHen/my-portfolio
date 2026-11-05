# Quản lý ảnh trong dashboard

Truy cập `/admin/media` sau khi đăng nhập. Trang này dùng phiên admin PostgreSQL và CSRF như các trang quản trị khác. Có thể kéo thả hoặc chọn JPEG/PNG/WebP, nhập alt text, tìm kiếm, phân trang, xem chi tiết, sửa mô tả, thay file và xóa ảnh chưa dùng. Mọi thông báo thành công phụ thuộc response API thực.

Phần **Ảnh trên các trang** cho phép gán Hero Avatar, Hero Background, ảnh About và Open Graph. Mở một slot, chọn ảnh có sẵn hoặc tải ảnh mới; có thể bỏ gán. Trong `/admin/projects`, lưu dự án trước rồi gán thumbnail và gallery, đổi thứ tự bằng nút lên/xuống. Một ảnh có thể dùng ở nhiều vị trí; cần bỏ mọi gán trước khi xóa ảnh khỏi thư viện. Các endpoint upload ảnh dự án cũ vẫn được giữ cho dữ liệu và client hiện có, nhưng giao diện quản trị dùng upload chung.

Nếu ảnh không hiện, kiểm tra `MEDIA_PUBLIC_BASE_URL`, backend port, `/api/v1/media/files/{uuid}` và quyền đọc object S3. Ảnh chưa gán trả 404 ở API công khai; xem được bằng endpoint admin khi đã đăng nhập. Nếu upload trả 413, file vượt 5 MB. Nếu trả 400, nội dung ảnh hoặc kích thước không hợp lệ. Nếu trả 401, đăng nhập lại; nếu 403, kiểm tra CSRF/proxy token. Nếu xóa trả 409, xem danh sách **Đang được dùng tại** rồi bỏ gán.

Trước khi triển khai production, cấu hình bucket S3, HTTPS public URL, quyền IAM tối thiểu, sao lưu database và object, rồi thử khôi phục. Alt text cần mô tả nội dung có ý nghĩa; Hero Background trang trí có thể có alt rỗng khi hiển thị công khai. Chưa có xử lý tối ưu ảnh, quét malware chuyên dụng hoặc hàng đợi dọn object mồ côi.
