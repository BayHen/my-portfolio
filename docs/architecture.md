# Kiến trúc giai đoạn 1

## Quyết định công nghệ

- **Next.js App Router + React + TypeScript strict:** nền tảng render và định tuyến cho portfolio, kiểm tra hợp đồng dữ liệu ngay lúc phát triển.
- **Tailwind CSS:** CSS tiện ích cho giao diện responsive; giữ CSS toàn cục ở `src/styles`.
- **Lucide React:** biểu tượng nhất quán khi bắt đầu triển khai giao diện.
- **Motion for React:** chuyển động có chủ đích trong giai đoạn giao diện; phải tôn trọng giảm chuyển động.
- **next-themes:** quản lý chế độ sáng/tối khi giao diện được xây dựng.
- **ESLint + Prettier:** phát hiện lỗi và thống nhất định dạng. Không thêm thư viện dữ liệu hoặc trạng thái trước khi cần.

## Ranh giới mô-đun

- `src/app`: route, layout và metadata của App Router; mã riêng route đặt gần route.
- `src/components`: thành phần giao diện dùng lại, chỉ tạo thư mục con theo nhu cầu thực tế.
- `src/content/projects`: dữ liệu dự án cục bộ.
- `src/config`: cấu hình hiển thị không bí mật.
- `src/types`: hợp đồng dữ liệu nội dung.
- `src/styles`: CSS toàn cục.
- `src/hooks`, `src/lib`: chỉ được tạo khi có logic dùng chung thực sự.

Giai đoạn 2 sử dụng `src/components/ui` cho primitive, `layout` cho điều hướng và theme, `projects` cho thành phần nhận dữ liệu portfolio, `shared` cho trạng thái giao diện. Cấu hình điều hướng ở `src/config/navigation.ts`. Token và bảng màu ở `src/styles/globals.css`; xem `docs/design-system.md`.

Ứng dụng hiện đọc dữ liệu từ module TypeScript cục bộ. Dữ liệu mẫu có cờ `placeholder`; giao diện không trình bày thành tựu hoặc lịch sử làm việc hư cấu như sự thật. Chưa có route API, backend, cơ sở dữ liệu hay admin.

Giai đoạn 3 thêm các tuyến công khai App Router. Danh sách dự án đọc `searchParams` trên server để lọc bằng URL; chi tiết dùng `generateStaticParams` và `notFound()` cho slug không hợp lệ. Nội dung case study là trường tùy chọn của `Project`, chỉ hiển thị khi có dữ liệu. Xem `docs/public-pages.md`.

## Hướng mở rộng

Khi nội dung được xác nhận, route dự án có thể dùng dữ liệu cục bộ trước. Sau khi có nhu cầu quản trị, backend FastAPI sẽ sở hữu dữ liệu và hợp đồng API; frontend gọi API thông qua lớp truy cập dữ liệu riêng. Biến môi trường máy chủ không được đưa vào `NEXT_PUBLIC_*`.

## Quyết định còn mở

Tên miền, danh tính và nội dung thật, nhà cung cấp gửi thư, lưu trữ ảnh, hosting, chính sách bảo mật và yêu cầu phân tích truy cập. Chỉ chốt khi có thông tin của chủ sở hữu.
