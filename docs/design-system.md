# Hệ thống thiết kế — Giai đoạn 2

## Định hướng

Portfolio cho người đọc thiên về kỹ thuật: bố cục biên tập, chữ rõ, nhiều khoảng thở, điểm nhấn xanh vừa đủ. Từ Giai đoạn 3, trang `/` là trang chủ công khai dùng nội dung mẫu được gắn nhãn.

## Token

Token tập trung trong `frontend/src/styles/globals.css`. Tailwind ánh xạ màu ngữ nghĩa (`canvas`, `surface`, `ink`, `muted`, `accent`, `line`, `subtle`) tới biến CSS để cùng một thành phần hoạt động ở cả hai theme.

| Token | Sáng | Tối |
| --- | --- | --- |
| Canvas | `#F8F7F4` | `#111316` |
| Surface | `#FFFFFF` | `#1B1E22` |
| Text | `#171717` | `#F4F3EF` |
| Muted | `#666666` | `#B1B4B8` |
| Accent | `#4169E1` | `#91A8FF` |
| Border | `#D8D7D2` | `#3D4249` |

Inter Variable được đóng gói cục bộ cho chữ chính; JetBrains Mono Variable dành cho nhãn kỹ thuật. Trọng lượng chính 400, 600, 700. Kích thước tiêu đề dùng `clamp` và breakpoint của Tailwind. Thang khoảng cách 4–64px, bán kính 8/16/24px, chiều rộng nội dung tối đa 1200px. Bóng đổ nhẹ chỉ áp dụng cho bề mặt nổi. Focus dùng viền 2px có offset 3px.

## Tương phản

Tính theo công thức WCAG cho các cặp chính: chữ/canvas sáng 16.73:1, muted/canvas sáng 5.36:1, accent/surface sáng 4.85:1; chữ/canvas tối 16.76:1, muted/canvas tối 8.94:1, accent/surface tối 7.37:1. Các cặp này đạt mức AA cho chữ thông thường. Cần đo lại nếu đổi token hoặc đặt chữ trên bề mặt khác.

## Theme và tương tác

`next-themes` hỗ trợ sáng, tối, hệ thống và lưu lựa chọn trong trình duyệt. Script khởi tạo của thư viện đặt class trước khi giao diện được vẽ; `html` bỏ qua cảnh báo hydration cho class đó. Nút chọn theme giữ cùng cấu trúc HTML trên server và lần render đầu; trạng thái chọn chỉ được đánh dấu sau khi client gắn vào. Điều hướng có liên kết bỏ qua header, `aria-current`, menu di động có `aria-expanded`, đóng bằng Escape, focus rõ và vùng bấm tối thiểu 44px. CSS tắt hiệu ứng chuyển động khi người dùng chọn giảm chuyển động.

## Thành phần

- `components/ui/primitives.tsx`: Button, IconButton, Card, SectionHeading, Container, Badge, Input, Textarea, Divider, ExternalLink, ActionLink.
- `components/layout`: Header, Footer, ThemeToggle, ThemeProvider.
- `components/projects`: ProjectCard, TechnologyBadge, SocialLinkCard, ExperienceItem, SectionWrapper.
- `components/shared/states.tsx`: LoadingState, EmptyState, ErrorState.

Thành phần dự án nhận dữ liệu có kiểu từ `src/types/portfolio.ts`; dữ liệu mẫu phải hiển thị nhãn rõ. Liên kết xã hội chỉ xuất hiện nếu đã có URL thật được xác nhận. Không thêm thư viện thành phần vì các primitive hiện đơn giản và không cần dependency mới.

## Giới hạn hiện tại

Các mục điều hướng trỏ tới route công khai. Chức năng gửi liên hệ vẫn chờ Giai đoạn 4. Kiểm tra trình duyệt trên nhiều kích thước và kiểm thử tương tác vẫn cần thực hiện trước khi công bố.
