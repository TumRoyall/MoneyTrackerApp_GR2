# transactions delete flow

## Steps

1. User yeu cau xoa theo transactionId
2. Load transaction theo id va user
3. Kiem tra wallet ownership
4. Rollback so tien (co dau)
5. Xoa transaction
6. Tra ve 204

## Notes
- Neu khong phai owner thi tra error
