# API conventions TO-BE

## Response
- Success:
  - { data, meta }
- Error:
  - { error: { code, message, details } }

## Paging
- page, size, sort
- meta: { page, size, totalItems, totalPages }

## Auth
- JWT Bearer token
- 401 khi chua auth, 403 khi khong du quyen
