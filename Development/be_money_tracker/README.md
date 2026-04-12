# MoneyTracker Backend

Backend cho ung dung Money Tracker (Spring Boot + PostgreSQL). Cung cap cac API cho dang nhap, tai khoan, danh muc, giao dich va dong bo du lieu.

## Cong nghe

- Java 21
- Spring Boot 3.5.7 (Web, Security, Validation, Data JPA, Mail)
- JWT (jjwt)
- PostgreSQL
- Maven

## Yeu cau

- JDK 21
- Maven (hoac dung `mvnw` / `mvnw.cmd`)
- PostgreSQL

## Cai dat va chay

### 1) Tao database

Tao database ten `moneytracker`, sau do chay schema trong file `databaseMoneyTracker.sql`.

### 2) Cau hinh ung dung

Cap nhat file `src/main/resources/application.properties`:

- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`
- `security.jwt.secret`
- `spring.mail.*`

Luu y: hien tai file nay co chua thong tin nhay cam (mat khau/secret). Nen dua cac gia tri nay ra bien moi truong truoc khi deploy.

### 3) Run ung dung

Windows:

```
./mvnw.cmd spring-boot:run
```

Mac/Linux:

```
./mvnw spring-boot:run
```

Ung dung mac dinh chay tai `http://localhost:8080`.

## API chinh

Tat ca API (tru `/api/auth/**`) deu can JWT `Authorization: Bearer <token>`.

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/verify?token=...`
- `POST /api/auth/resend?email=...`
- `GET /api/auth/check-email?email=...`

### Accounts

- `POST /api/accounts`
- `GET /api/accounts`
- `DELETE /api/accounts/{accountId}`

### Categories

- `GET /api/categories`
- `GET /api/categories/{id}`

### Transactions

- `GET /api/transactions` (ho tro filter va paging)
- `POST /api/transactions`
- `PUT /api/transactions/{id}`
- `DELETE /api/transactions/{id}`

### Sync

- `GET /api/sync/pull?cursor=0&limit=500`
- `POST /api/sync/push`

## CORS

Backend cho phep CORS tu `http://localhost:8081` (xem `WebConfig`). Neu frontend chay port khac, hay cap nhat lai.

## Ghi chu

- `spring.jpa.hibernate.ddl-auto=validate` vi schema da co san.
- DB schema nam trong `databaseMoneyTracker.sql`.
