# sync pull flow (planned)

## Steps

1. Client yeu cau changes voi cursor va limit
2. Validate cursor va limit
3. Load change log sau cursor
4. Lay change moi nhat theo entity va entity_pk
5. Tao changes map va deletes map
6. Tra ve nextCursor va hasMore

## Notes
- Chi tra ve cac entity duoc ho tro
