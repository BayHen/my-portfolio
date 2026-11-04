# Yêu cầu và phạm vi MVP

## Mục tiêu

Xây dựng portfolio nhanh, dễ đọc, có khả năng truy cập và thể hiện năng lực Python Backend / Full-stack bằng các dự án có ngữ cảnh rõ ràng. Nội dung công khai phải dựa trên dữ liệu thực được chủ sở hữu xác nhận trước khi xuất bản.

## Đối tượng

Nhà tuyển dụng, trưởng nhóm kỹ thuật, khách hàng tiềm năng và cộng tác viên muốn xem năng lực, dự án và cách liên hệ.

## Yêu cầu chức năng

- Trang chủ giới thiệu định hướng chuyên môn, dự án nổi bật và đường dẫn liên hệ.
- Danh sách dự án và trang chi tiết dạng case study khi có nội dung thật.
- Điều hướng responsive, hỗ trợ bàn phím và chế độ sáng/tối.
- Liên hệ thực qua địa chỉ email hoặc biểu mẫu được kết nối với dịch vụ thật; không hiển thị biểu mẫu không hoạt động.
- Metadata, sitemap và nội dung có cấu trúc phù hợp SEO khi có thông tin xuất bản.

## Yêu cầu phi chức năng

- TypeScript strict, lint, kiểm tra kiểu và build thành công.
- Giao diện phản hồi trên màn hình nhỏ, tôn trọng `prefers-reduced-motion`, độ tương phản và cấu trúc HTML ngữ nghĩa.
- Nội dung tách khỏi thành phần trình bày, không chứa bí mật trong mã phía trình duyệt.
- Tối ưu ảnh, phông chữ và tải trang; đo hiệu năng trước khi đặt ngưỡng cụ thể.

## Phạm vi MVP

MVP của sản phẩm gồm trang chủ, danh sách và chi tiết dự án có dữ liệu thật, phương thức liên hệ hoạt động, SEO cơ bản và khả năng truy cập. **Giai đoạn 1 chỉ xây dựng nền tảng kỹ thuật**: ứng dụng chạy được, cấu trúc, kiểu dữ liệu, dữ liệu mẫu được gắn nhãn và tài liệu. Giao diện hoàn chỉnh cùng chức năng liên hệ thuộc các giai đoạn tiếp theo.

## Phạm vi full-stack tương lai

FastAPI, PostgreSQL, SQLAlchemy, Alembic, Pydantic, API cho nội dung và liên hệ, xác thực và Admin Dashboard riêng. Thiết kế API, lưu trữ dữ liệu và cơ chế gửi thư cần được quyết định khi đến giai đoạn triển khai.

## Cấu trúc trang dự kiến

| Đường dẫn | Nội dung |
| --- | --- |
| `/` | Giới thiệu và dự án nổi bật |
| `/projects` | Danh sách dự án |
| `/projects/[slug]` | Case study |
| `/contact` | Liên hệ thực |

Giai đoạn 1 chỉ triển khai `/` làm trang xác nhận ứng dụng hoạt động.

## Tiêu chí chấp nhận giai đoạn 1

- Có tài liệu yêu cầu, kiến trúc, lộ trình và hướng dẫn Git bằng tiếng Việt.
- Ứng dụng App Router trong `frontend/src` chạy cục bộ.
- TypeScript strict, ESLint, Prettier, Tailwind CSS, alias và mẫu môi trường được cấu hình.
- Có `Profile`, `Project`, `Technology`, `Experience`, `SocialLink` cùng dữ liệu mẫu được đánh dấu.
- `lint`, `typecheck`, `build` thành công; không có backend hay admin được dựng sớm.
