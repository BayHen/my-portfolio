# Checklist phát hành DEVFOLIO v1.0

Ghi ngày, người kiểm tra, môi trường, URL và kết quả thực tế khi chạy checklist. Không đánh dấu đạt nếu chưa đo.

## Nội dung và SEO

- [ ] Hồ sơ, kinh nghiệm, học vấn và case study được chủ sở hữu xác nhận; không còn `placeholder` hoặc `TODO` công khai.
- [ ] Tên miền HTTPS được đặt trong `SITE_URL`; canonical, Open Graph, Twitter card và metadata từng trang đúng URL.
- [ ] `robots.txt` và `sitemap.xml` chỉ liệt kê trang được phép index; admin/API không lộ trong sitemap.
- [ ] JSON-LD được kiểm tra bằng công cụ xác thực; ảnh có alt mô tả đúng nội dung.

## Chức năng

- [ ] `/`, `/projects`, chi tiết dự án, `/about`, `/contact` và trang 404 hoạt động.
- [ ] Bộ lọc dự án, menu mobile, theme sáng/tối/hệ thống và lưu theme hoạt động.
- [ ] Ảnh đúng tỷ lệ, không lỗi tải, không tràn ngang tại 360px, 390px, 768px, 1024px và desktop rộng.
- [ ] CV thật tải được hoặc hành động tải được ẩn; liên kết ngoài dẫn tới đích thật.
- [ ] Biểu mẫu gửi thử tới hộp thư được phép; kiểm tra xác thực, lỗi mạng, lỗi provider, chống spam và giới hạn gửi.

## Chất lượng và bảo mật

- [ ] `format:check`, `typecheck`, `lint`, `test`, `build`, `test:e2e` đều qua ở commit phát hành.
- [ ] Kiểm tra bằng bàn phím, trình đọc màn hình, focus, nhãn form, thông báo lỗi, tương phản, touch target và giảm chuyển động.
- [ ] Không có khóa trong client bundle, log, repository hoặc biến `NEXT_PUBLIC_*`.
- [ ] Đánh giá Lighthouse trên URL production: mục tiêu Performance, Accessibility, Best Practices, SEO đều ≥ 90; ghi điểm đo thực tế.
- [ ] Kiểm tra chống lạm dụng trong môi trường nhiều instance và chính sách retention cho lời nhắn.
- [ ] Kiểm tra preview và production deployment, domain, HTTPS, lỗi 404/500 và header bảo mật.

## Biên bản đo

| Mục | Môi trường / ngày | Kết quả |
| --- | --- | --- |
| Lighthouse Performance | Local `next start`, Edge headless, 04/11/2026 | 89; LCP 3,1 giây, CLS 0,009 |
| Lighthouse Accessibility | Local `next start`, Edge headless, 04/11/2026 | 100 |
| Lighthouse Best Practices | Local `next start`, Edge headless, 04/11/2026 | 96 |
| Lighthouse SEO | Local `next start`, Edge headless, 04/11/2026 | 63; `noindex` do nội dung mẫu |
| Production URL | Chưa triển khai | Chưa xác nhận |
