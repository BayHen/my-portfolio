# API công khai

FastAPI phục vụ OpenAPI tại `/api/docs`, schema JSON tại `/api/openapi.json`, các endpoint tại `/api/v1`. Kết quả lỗi có `error.code`, `error.message`, `error.request_id`; response có header `X-Request-ID`.

| Endpoint | Kết quả |
| --- | --- |
| `GET /health` | Tình trạng tiến trình, không truy vấn database |
| `GET /health/db` | Truy vấn database; trả 503 nếu không kết nối được |
| `GET /projects` | Dự án đã xuất bản, hỗ trợ `limit`, `offset`, `featured`, `technology` |
| `GET /projects/{slug}` | Chi tiết dự án đã xuất bản; 404 cho slug không có hoặc bản nháp |
| `GET /technologies` | Công nghệ, có thể lọc `category` |
| `GET /profile` | Hồ sơ đã xuất bản; 404 nếu chưa có |
| `GET /experiences` | Kinh nghiệm đã xuất bản; mảng rỗng nếu chưa có |
| `POST /contact` | Kiểm tra, giới hạn tần suất và lưu lời nhắn; cần `Idempotency-Key` |

Ví dụ kiểm tra trong PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/health
Invoke-RestMethod http://127.0.0.1:8000/api/v1/health/db
Invoke-RestMethod 'http://127.0.0.1:8000/api/v1/projects?limit=12&offset=0'
```

Không có GET công khai cho lời nhắn. API quản trị đã có từ Phase 7 và được mô tả riêng trong [admin.md](admin.md).
