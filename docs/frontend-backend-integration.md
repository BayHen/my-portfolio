# Kết nối Next.js với FastAPI

Trong `frontend/.env.local`, đặt `BACKEND_API_URL=http://127.0.0.1:8000`. Chỉ server Next.js đọc biến này. `src/lib/portfolio-api.ts` chuyển JSON backend sang các type portfolio hiện có, đặt timeout 5 giây và cache tối đa 60 giây cho dữ liệu công khai. Các trang dự án, chi tiết, công nghệ, hồ sơ và kinh nghiệm dùng lớp này. Nếu backend trả lỗi, trang hiển thị trạng thái lỗi; không tráo dữ liệu giả vào kết quả backend.

Khi `BACKEND_API_URL` trống, frontend vẫn hiển thị nội dung mẫu cục bộ được đánh dấu placeholder. Đây là chế độ phát triển hiện có, không phải dữ liệu đã xác minh. Database cục bộ hiện chưa có dự án hoặc profile đã xuất bản, vì vậy các trang tương ứng có thể hiển thị trạng thái rỗng khi bật backend.

Form liên hệ đi theo luồng Browser → `/api/contact` của Next.js → `/api/v1/contact` của FastAPI. Đặt cùng một chuỗi bí mật vào `BACKEND_CONTACT_PROXY_TOKEN` ở `frontend/.env.local` và `CONTACT_PROXY_TOKEN` ở `backend/.env`. Không dùng tiền tố `NEXT_PUBLIC_`. Nếu đã đặt backend nhưng thiếu token, Next.js trả 503. Khi không đặt backend, endpoint liên hệ cũ dùng Resend nếu được cấu hình; hai luồng không chạy đồng thời. Form chỉ báo thành công sau khi dịch vụ xác nhận.

Khởi động frontend từ `frontend/` bằng `npm install` và `npm run dev`. Kiểm tra `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. Nếu trang báo backend không sẵn sàng, kiểm tra `/api/v1/health/db` và URL cục bộ. Nếu liên hệ trả 502, kiểm tra token ở hai phía và trạng thái backend. Không đưa URL nội bộ, token hay mật khẩu vào biến `NEXT_PUBLIC_`.
