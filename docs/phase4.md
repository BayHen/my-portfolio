# Giai đoạn 4 — nội dung, chuyển động và liên hệ

## Nội dung

Chỉnh hồ sơ tại `frontend/src/content/profile.ts` và dự án tại `frontend/src/content/projects/index.ts`. Các trường thiếu có chú thích `TODO`; không công bố thông tin hư cấu. `Project` có trường tùy chọn cho vấn đề, mục tiêu, kiến trúc, tính năng, vai trò, thách thức, giải pháp, kiểm thử, kết quả đã xác minh và bài học. Trang chi tiết chỉ hiện mục có nội dung. Văn bản hiện là chuỗi thuần trong TypeScript; không thực thi Markdown/MDX tùy ý, tránh đưa mã không tin cậy vào trang.

## Chuyển động

Motion for React tạo hiệu ứng vào trang bằng opacity và translateY nhỏ, không thay đổi kích thước bố cục. Section dùng quan sát viewport một lần; `prefers-reduced-motion` bỏ hiệu ứng dịch chuyển. Hover và focus đều giữ thông tin quan trọng luôn hiển thị. Các hiệu ứng tương tác cần được kiểm tra trực quan trên thiết bị thật trước khi công bố.

## Ảnh và CV

Ảnh dự án dùng `next/image`, tỷ lệ khung cố định, `sizes` và `alt`; ảnh nằm dưới màn hình mặc định tải trễ. Thay đường dẫn trong dữ liệu dự án bằng tài sản thật đã được phép sử dụng. Không có ảnh thật thì hiển thị nhãn đang cập nhật.

Để bật **Download CV**, đặt PDF thật tại `frontend/public/resume.pdf`, rồi đặt `resumeUrl: "/resume.pdf"` trong hồ sơ. Có thể dùng URL HTTPS trực tiếp tới PDF đáng tin cậy. Nếu thiếu tệp hoặc URL không hợp lệ, hành động tải sẽ không xuất hiện.

## Gửi liên hệ

Route `POST /api/contact` dùng Resend từ máy chủ qua REST API. Cấu hình cả ba biến trong `frontend/.env.local` (tham khảo `frontend/.env.example`):

- `RESEND_API_KEY`: khóa có quyền gửi, thuộc domain đã xác minh.
- `CONTACT_FROM_EMAIL`: địa chỉ gửi thuộc domain đã xác minh.
- `CONTACT_TO_EMAIL`: địa chỉ nhận của chủ portfolio.

Không thêm `NEXT_PUBLIC_` cho các biến này. Khi thiếu cấu hình, biểu mẫu vô hiệu hóa và API trả 503. Client và server cùng kiểm tra tên 2–100 ký tự, email tối đa 254 và lời nhắn 10–5000. Route yêu cầu JSON cùng origin, giới hạn body 7000 byte, dùng honeypot và chặn quá 5 lần/10 phút cho mỗi IP trong một tiến trình. Giới hạn trong bộ nhớ **không đồng bộ giữa các instance/serverless**; trước khi triển khai quy mô lớn cần dùng bộ đếm chia sẻ tại edge hoặc Redis và cấu hình proxy tin cậy. Không ghi nội dung thư vào log. Chỉ báo tiếp nhận khi Resend trả HTTP thành công cùng mã email; điều đó chưa xác nhận thư đã phát tới hộp thư.

Việc gửi thật **chưa được xác minh** vì chưa có khóa và địa chỉ do chủ sở hữu cung cấp. Cần kiểm thử với domain đã xác minh, kiểm tra hộp thư nhận và xử lý bounce trước khi công bố.

## Chuyển sang FastAPI ở Giai đoạn 6

Giữ hợp đồng `{ name, email, message, website }` và lỗi theo trường. Chuyển xác thực, chống lạm dụng và gọi Resend sang FastAPI; frontend đổi endpoint `/api/contact` thành proxy hoặc API server đã xác thực nguồn. Giữ bí mật ở backend, kiểm thử lại trạng thái tiếp nhận/lỗi và chính sách CORS/CSRF trước khi tắt route Next.js.
