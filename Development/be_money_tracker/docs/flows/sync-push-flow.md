# sync push flow (planned)

## Steps

1. Client gui batch operations
2. Validate request va ops
3. Kiem tra idempotency theo (user_id, device_id, op_id)
4. Xu ly tung operation
5. Neu conflict, tra ve serverVersion va serverData
6. Luu dedup record neu thanh cong
7. Tra ve results list

## Notes
- Entity khong ho tro thi tra error
