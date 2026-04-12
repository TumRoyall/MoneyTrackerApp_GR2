# categories API (TO-BE)

## Base URL
/api

## Endpoints

### GET /api/categories
- purpose: list category
- response: { data: [category] }

### GET /api/categories/{categoryId}
- purpose: xem chi tiet category
- response: { data: category }

### POST /api/categories
- purpose: tao category
- request body:
  - name
  - type (EXPENSE, INCOME)
  - icon (optional)
  - color (optional)
- response: { data: category }

### PUT /api/categories/{categoryId}
- purpose: cap nhat category
- request body:
  - name (optional)
  - icon (optional)
  - color (optional)
- response: { data: category }

### PATCH /api/categories/{categoryId}/hide
- purpose: an category (is_hidden)
- response: { data: { hidden: true } }

## Notes
- JWT required
