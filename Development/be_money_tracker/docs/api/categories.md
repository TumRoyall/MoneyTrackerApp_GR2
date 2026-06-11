# categories API

## Base URL
/api

## Endpoints

### GET /api/categories
- purpose: lay danh sach category (default + user tao)
- response body: list of CategoryResponse
  - categoryId (UUID)
  - name (string)
  - icon (string)
  - color (string)
  - type (EXPENSE, INCOME)

### GET /api/categories/{id}
- purpose: lay category neu user co quyen
- response body: CategoryResponse

### POST /api/categories
- purpose: them category moi
- request body:
  - name (string)
  - type (EXPENSE, INCOME)
  - icon (string, optional)
  - color (string, optional)
- response body: CategoryResponse

### PUT /api/categories/{id}
- purpose: cap nhat category
- request body:
  - name (string, optional)
  - icon (string, optional)
  - color (string, optional)
- response body: CategoryResponse

### PATCH /api/categories/{id}/hide
- purpose: an category
- response:
  - message string

## Notes
- JWT required cho tat ca endpoint
- Hide dung is_hidden

## Notes
- JWT required cho tat ca endpoint
