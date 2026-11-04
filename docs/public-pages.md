# Trang portfolio công khai — Giai đoạn 3

## Tuyến đường

| Tuyến | Nội dung |
| --- | --- |
| `/` | Giới thiệu mẫu, dự án nổi bật, nhóm công nghệ và đường dẫn chính |
| `/projects` | Danh sách, lọc theo công nghệ và danh mục bằng query string |
| `/projects/[slug]` | Case study lấy từ dữ liệu cục bộ; slug không hợp lệ trả 404 |
| `/about` | Giới thiệu, định hướng, nhóm kỹ năng, hành trình và triết lý |
| `/contact` | Thông tin liên hệ và biểu mẫu gửi qua route máy chủ khi được cấu hình |

`not-found.tsx` phục vụ đường dẫn không có nội dung; `error.tsx` cho lỗi khi render route. Cả hai có đường về trang chủ.

## Dữ liệu và nguyên tắc hiển thị

Nguồn dữ liệu nằm trong `frontend/src/content`. `Project` có các trường case study tùy chọn: vấn đề, giải pháp, vai trò, kiến trúc, tính năng, thách thức, ảnh, kiểm thử và kết quả. Trang chi tiết bỏ qua trường chưa có dữ liệu. Ảnh thật được hiển thị bằng `next/image` khi có đường dẫn và văn bản thay thế; khi thiếu ảnh, vùng minh họa ghi rõ đang cập nhật.

Hai mục **Coffee Shop Management System** và **VoiceMorph Studio** là ý tưởng mẫu để thử tuyến, bộ lọc và bố cục. Trạng thái `Ý tưởng mẫu` không phải trạng thái hoàn thành. Không có số liệu, lịch sử làm việc, liên kết GitHub, demo hay CV được suy đoán.

Bộ lọc dùng URL như `/projects?technology=Python&category=Creative+tool`. Mỗi lựa chọn là liên kết, hoạt động khi không có JavaScript; trạng thái rỗng có đường xóa bộ lọc. Route danh sách là Server Component; chỉ điều hướng, theme và ranh giới lỗi dùng Client Component.

## Liên hệ

Chưa có địa chỉ email công khai được cung cấp. Giai đoạn 4 đã thêm route gửi qua Resend, xác thực đầu vào, chống lạm dụng cơ bản và thông báo trạng thái. Biểu mẫu chỉ bật khi có cấu hình gửi thật; xem `docs/phase4.md`.

## Kiểm tra trước công bố

Thay nội dung mẫu bằng thông tin đã xác nhận; cung cấp ảnh có quyền sử dụng, liên kết thật và CV nếu muốn công bố. Kiểm tra trực quan trên điện thoại, máy tính bảng và desktop, gồm menu, bộ lọc, trang chi tiết, theme, focus và tràn ngang. Kiểm tra metadata, quyền riêng tư và khả năng truy cập với nội dung cuối cùng.
