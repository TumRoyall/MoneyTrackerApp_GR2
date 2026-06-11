# 🚨 MANDATORY WORKFLOW (BẮT BUỘC)

## 1. Nguyên tắc
- KHÔNG được code trước khi có design trong docs
- Mọi thay đổi phải được ghi vào docs trước hoặc ngay sau khi làm

## 2. Flow làm việc chuẩn

Bước 1: Viết design
→ docs/modules/<feature>.md

Bước 2: Xác nhận logic
→ docs/flows/<feature>-flow.md

Bước 3: Thiết kế API
→ docs/api/<feature>.md

Bước 4: Update database (nếu có)
→ docs/database/database.md

Bước 5: Ghi decision
→ docs/decisions/decision-log.md

Bước 6: MỚI ĐƯỢC CODE

## 3. Khi sửa code
- Phải update lại docs tương ứng

## 4. Mục tiêu
- Người khác đọc docs hiểu system
- Có thể bảo vệ đồ án KHÔNG cần mở code