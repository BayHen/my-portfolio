# Triển khai frontend trên Vercel

## Trước khi triển khai

Ứng dụng chưa đủ điều kiện công bố v1.0: hồ sơ và dự án còn là dữ liệu mẫu; chưa có PDF CV, ảnh thật, domain và tài khoản email được xác minh. Route liên hệ trả 503 nếu thiếu cấu hình. Hoàn thành `docs/release-checklist.md` trước khi bật tìm kiếm hoặc công bố.

## Thiết lập Vercel

1. Kết nối repository trong Vercel khi có quyền triển khai.
2. Chọn **Root Directory** là `frontend` và **Framework Preset** là Next.js.
3. Dùng `npm ci` nếu cần chỉ định lệnh cài đặt; lệnh build `npm run build`. Giữ Output Directory mặc định của Next.js.
4. Khai báo `SITE_URL` là origin HTTPS chính thức, không có path. Không đặt domain giả. Với preview, có thể để trống để giữ `noindex`.
5. Khai báo `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` trong Environment Variables của môi trường cần gửi. Không thêm `NEXT_PUBLIC_`; dùng khóa giới hạn quyền gửi và domain email đã xác minh.
6. Kiểm tra preview deployment thủ công. Chỉ cho phép production deployment sau khi có nội dung thật, kiểm tra release và phê duyệt triển khai.

Không có workflow tự động deploy trong repository. Khi kết nối Git, cần kiểm tra chính sách production branch và preview deployments trong Vercel trước khi bật tích hợp. Nếu dùng tên miền riêng, thêm domain trong Settings → Domains, cập nhật DNS theo hướng dẫn của Vercel, sau đó đặt `SITE_URL` thành origin chính thức và xác minh canonical/sitemap/robots trên deployment mới.

## Lệnh xác nhận trước phát hành

Trong `frontend/`: `npm ci`, `npm run format:check`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`. CI dùng Chromium; máy Windows có thể dùng Edge đã cài. E2E dùng khóa email giả trong process thử nghiệm và chặn request form ở trình duyệt; không gửi email thật.

## Gửi email và chống lạm dụng

Sau khi cấu hình Resend, kiểm tra một lời nhắn thật với địa chỉ nhận đã được phép, xác minh hộp thư nhận và phản hồi lỗi. Giới hạn 5 lần/10 phút hiện lưu trong bộ nhớ từng tiến trình; trên Vercel nhiều instance cần chuyển sang bộ đếm dùng chung hoặc dịch vụ chống lạm dụng trước khi mở lưu lượng công khai. `robots.txt` chỉ hướng dẫn bot, không bảo vệ route admin tương lai; admin cần xác thực riêng.

## Trạng thái hiện tại

Chưa có deployment URL hoặc lần kiểm tra production nào được xác nhận. Cấu hình root và lệnh build đã được tài liệu hóa; chưa tạo project Vercel hay thay đổi remote.
