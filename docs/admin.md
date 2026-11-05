# Quản trị DEVFOLIO — Phase 7

## Chẩn đoán HTTP 401

DEVFOLIO không dùng JWT, `Authorization: Bearer`, access token hoặc refresh token. Đăng nhập tạo phiên trong PostgreSQL và cookie HttpOnly `devfolio_admin`; mặc định phiên hết hạn sau 8 giờ và cần đăng nhập lại. `POST /api/v1/admin/login` trả 401 khi email hoặc mật khẩu sai. Các endpoint `/api/v1/admin/*` khác, cùng route proxy `/api/admin/*`, trả 401 khi thiếu cookie, phiên hết hạn hoặc đã logout. Thiếu/sai `ADMIN_PROXY_TOKEN` trả 403; CSRF không hợp lệ cho thao tác ghi cũng trả 403. API công khai `/api/v1/health`, `/projects`, `/technologies`, `/profile`, `/experiences` không đòi phiên quản trị (nội dung chưa xuất bản có thể trả 404).

Khi kiểm tra cục bộ, dùng cùng host cho frontend trong suốt phiên, ví dụ `http://localhost:3000/admin/login`; cookie host-only của `localhost` không được gửi khi chuyển sang `127.0.0.1`. Với HTTP cục bộ, đặt `ADMIN_COOKIE_SECURE=false` trong `backend/.env`. Nếu backend đặt `ADMIN_PROXY_TOKEN`, frontend phải đặt cùng giá trị trong `frontend/.env.local`. Sau khi sửa biến môi trường, khởi động lại tiến trình tương ứng. Không ghi cookie, token hoặc mật khẩu vào log. Nếu `/api/admin/session` trả 401, đăng nhập lại; nếu trả 503, kiểm tra backend và database trước.

## Mô hình xác thực

Trình duyệt gọi `/api/admin/*` cùng origin với Next.js. Route handler Next.js chuyển tiếp yêu cầu đến `/api/v1/admin/*` của FastAPI; backend kiểm tra phiên và quyền trên mọi endpoint. Phiên được lưu trong PostgreSQL, cookie `devfolio_admin` là HttpOnly, SameSite=Strict và Secure trong production. Database chỉ lưu SHA-256 của token phiên. CSRF token riêng được trả qua `/session` cho JavaScript của trang quản trị và bắt buộc trong header `X-CSRF-Token` với mọi thao tác ghi. Không lưu token phiên trong `localStorage`. Logout đánh dấu phiên bị thu hồi; phiên tự hết hạn sau số giờ cấu hình.

Backend có thể yêu cầu `ADMIN_PROXY_TOKEN` để chỉ nhận các yêu cầu admin qua Next.js. Dùng cùng một giá trị ngẫu nhiên dài ít nhất 32 ký tự trong `backend/.env` và `frontend/.env.local`. Đặt `APP_ENV=production` và `ADMIN_COOKIE_SECURE=true` khi triển khai HTTPS; backend từ chối khởi động production nếu thiếu các điều kiện đó. Với HTTP cục bộ, đặt `ADMIN_COOKIE_SECURE=false`. Không đưa các biến này vào `NEXT_PUBLIC_`.

Chưa có đăng ký công khai. Sau khi chạy `alembic upgrade head`, cấp tài khoản từ terminal trên máy tin cậy:

```powershell
cd backend
.\.venv\Scripts\python.exe -m app.services.provision_admin
```

Lệnh hỏi email và mật khẩu qua terminal, không nhận mật khẩu qua tham số dòng lệnh. Mật khẩu phải dài 16–128 ký tự và được băm bằng Argon2id. Lệnh từ chối ghi đè tài khoản đã có. Không chạy lệnh này trong log CI hoặc terminal chia sẻ.

## Route và thao tác

Dashboard: `/admin`, `/admin/projects`, `/admin/technologies`, `/admin/experiences`, `/admin/messages`, `/admin/settings`. `/admin/login` mở khi chưa đăng nhập. Các route còn lại kiểm tra phiên trên server và chuyển về login khi thiếu phiên. Dashboard dùng lại màu sắc và thành phần của design system; có menu đáp ứng màn hình nhỏ, trạng thái tải, lỗi và xác nhận xóa.

Các endpoint dưới đây có tiền tố `/api/v1/admin` ở backend và `/api/admin` qua Next.js:

| Nhóm | Endpoint |
| --- | --- |
| Phiên | `POST /login`, `GET /session`, `POST /logout` |
| Tổng quan | `GET /overview` |
| Dự án | `GET/POST /projects`, `GET/PUT/DELETE /projects/{id}`, `POST /projects/{id}/publish`, `/unpublish` |
| Công nghệ | `GET/POST /technologies`, `PUT/DELETE /technologies/{id}` |
| Kinh nghiệm | `GET/POST /experiences`, `PUT/DELETE /experiences/{id}`, `POST /experiences/{id}/publish`, `/unpublish` |
| Hồ sơ | `GET/PUT /profile`, `POST /profile/publish`, `/unpublish` |
| Lời nhắn | `GET /messages` với `search`, `read`, `limit`, `offset`; `PATCH/DELETE /messages/{id}` |
| Ảnh | `POST /projects/{id}/images`, `PUT /projects/{id}/images/order`, `PATCH/DELETE /projects/{id}/images/{image_id}` |

Các thao tác đọc (trừ login) cần phiên; thao tác ghi cần cả phiên và CSRF. Dự án, hồ sơ và kinh nghiệm ở trạng thái nháp không xuất hiện trong API công khai. `published_at` quyết định việc hiển thị. Khi sửa một bản ghi đã xuất bản, nội dung mới trở thành công khai sau khi cache frontend hết hạn tối đa khoảng 60 giây. Muốn soạn thay đổi kín trước, hãy hủy xuất bản trước khi sửa. Xóa dự án còn ảnh bị chặn; xóa công nghệ đang gắn với dự án trả 409. Xóa lời nhắn cần xác nhận trên giao diện.

## Lưu ảnh

Ảnh dùng S3 hoặc dịch vụ tương thích, không ghi vào ổ đĩa tạm của ứng dụng. Cấu hình `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT_URL` (nếu cần) và `S3_PUBLIC_BASE_URL`; quyền truy cập S3 dùng chuỗi credentials tiêu chuẩn của AWS SDK ở server. Endpoint đọc tối đa 5 MB, kiểm tra nội dung ảnh bằng Pillow, chỉ chấp nhận JPEG, PNG hoặc WebP kích thước 100–6000 px mỗi chiều, tạo tên ngẫu nhiên và yêu cầu mô tả ảnh. Production yêu cầu URL ảnh công khai dùng HTTPS. Thứ tự ảnh được lưu trong database. Chưa có pipeline tối ưu kích thước hoặc quét malware chuyên dụng; chỉ cấp quyền bucket tối thiểu và giám sát chi phí/lưu lượng.

## Kiểm tra và vận hành

Trong `backend/`, chạy Ruff, pytest và Alembic như [hướng dẫn backend](backend.md). Trong `frontend/`, chạy `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Kiểm tra đăng nhập, hết hạn phiên, CSRF, dữ liệu nháp, upload ảnh và việc công bố trên môi trường staging với HTTPS trước khi mở production. Audit event lưu hành động và ID mục tiêu, không lưu mật khẩu, token hay nội dung lời nhắn. Đăng nhập thất bại bị giới hạn 5 lần theo IP và email trong 15 phút.

## Giới hạn cần giải quyết trước production

Chưa có MFA, luồng tự đặt lại mật khẩu, phân quyền nhiều vai trò hoặc hàng đợi dọn dẹp object S3. Khi xóa ảnh, bản ghi database được xóa trước; lỗi S3 về sau có thể để lại object mồ côi. Cần chính sách sao lưu, lưu giữ/xóa lời nhắn, giám sát audit, quản lý bí mật và thử khôi phục trước khi phục vụ dữ liệu thật. Nếu frontend và backend được triển khai khác topology đã mô tả, phải kiểm tra lại forwarding cookie, origin và IP của reverse proxy.
