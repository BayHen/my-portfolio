# Sửa hydration mismatch của Reveal

`Reveal` trước đây lấy `useReducedMotion()` ngay trong render. Server không biết thiết lập media query của trình duyệt, nên có thể xuất `initial` chứa opacity/transform trong khi lần render đầu trên client xuất `initial=false`. React báo markup/style khác nhau khi hydrate.

Component hiện dùng `useSyncExternalStore` với server snapshot `false`. React dùng cùng snapshot đó khi hydrate, rồi cập nhật theo `prefers-reduced-motion` sau khi gắn trình duyệt. CSS media query buộc `.reveal` hiện đầy đủ và bỏ transform cho người dùng giảm chuyển động, kể cả trước khi JavaScript chạy. Chuyển động mặc định vẫn dùng Motion for React.

Kiểm tra bằng `npm run test:e2e -- e2e/reveal-hydration.spec.ts` trong `frontend/`. Test chạy desktop và mobile, kiểm tra console hydration, trạng thái thường và reduced motion. `npm run build`, typecheck, lint và unit tests cũng phải đạt. Nếu Playwright trên Windows để lại server cổng 3100 sau test, dừng đúng tiến trình do lần test đó tạo trước khi chạy lại để tránh dùng bản build cũ.
