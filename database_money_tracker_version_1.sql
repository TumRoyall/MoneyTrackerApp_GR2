-- ==========================
--  BẢNG NGƯỜI DÙNG
-- ==========================
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,            -- email đăng nhập
    password_hash VARCHAR(255),                   -- có thể null nếu đăng nhập OAuth
    provider VARCHAR(50) DEFAULT 'local',         -- 'local' | 'google' | 'facebook'...
    full_name VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,               -- true nếu là admin
    is_verified BOOLEAN DEFAULT FALSE,            -- xác thực email chưa
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

COMMENT ON TABLE users IS 'Lưu thông tin người dùng, gồm tài khoản local và OAuth.';

-- ==========================
--  BẢNG VÍ (CÓ 1 CHỦ, NHIỀU NGƯỜI DÙNG)
-- ==========================
CREATE TABLE wallets (
    wallet_id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(user_id),
    name VARCHAR(255) NOT NULL,                   -- tên ví (vd: Ví tiền mặt, Momo)
    balance DECIMAL(15,2) DEFAULT 0,              -- số dư hiện tại
    currency VARCHAR(10) NOT NULL,                -- loại tiền (VND, USD, JPY)
    created_at TIMESTAMP DEFAULT now()
);

COMMENT ON TABLE wallets IS 'Mỗi ví có 1 chủ (owner_id) và 1 loại tiền cố định.';

-- ==========================
--  BẢNG THÀNH VIÊN CHIA SẺ VÍ
-- ==========================
CREATE TABLE wallet_members (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',            -- 'owner' | 'member'
    joined_at TIMESTAMP DEFAULT now()
);

COMMENT ON TABLE wallet_members IS 'Liên kết nhiều người dùng với ví (chia sẻ ví).';

-- ==========================
--  BẢNG DANH MỤC CHI TIÊU / THU NHẬP
-- ==========================
CREATE TABLE categories (
    category_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),     -- null = danh mục hệ thống
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,                    -- 'expense' | 'income'
    icon VARCHAR(50),
    color VARCHAR(20)
);

COMMENT ON TABLE categories IS 'Danh mục chi tiêu hoặc thu nhập. Người dùng có thể thêm riêng.';

-- ==========================
--  BẢNG GIAO DỊCH
-- ==========================
CREATE TABLE transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    created_by BIGINT NOT NULL REFERENCES users(user_id),
    category_id BIGINT REFERENCES categories(category_id),
    amount DECIMAL(15,2) NOT NULL,
    note TEXT,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'success',          -- 'pending' | 'success' | 'failed'
    created_at TIMESTAMP DEFAULT now()
);

COMMENT ON TABLE transactions IS 'Chi tiết các giao dịch trong ví (chi, thu, chuyển).';

-- ==========================
--  BẢNG NGÂN SÁCH
-- ==========================
CREATE TABLE budgets (
    budget_id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(category_id),
    amount_limit DECIMAL(15,2) NOT NULL,           -- hạn mức
    current_spent DECIMAL(15,2) DEFAULT 0,         -- chi tiêu hiện tại
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notify_threshold DECIMAL(5,2) DEFAULT 0.8,     -- ví dụ 0.8 = cảnh báo 80%
    currency VARCHAR(10) NOT NULL                  -- khớp với ví
);

COMMENT ON TABLE budgets IS 'Giới hạn chi tiêu cho danh mục trong 1 ví, có cảnh báo khi gần hết.';

-- ==========================
--  RÀNG BUỘC VÀ TỐI ƯU
-- ==========================

-- Chỉ cho phép 1 ngân sách active cùng category trong cùng ví
CREATE UNIQUE INDEX uq_budget_wallet_category_period 
ON budgets(wallet_id, category_id, start_date, end_date);

-- Khi xóa user => xóa các bảng liên quan
ALTER TABLE wallets
  ADD CONSTRAINT fk_wallets_owner
  FOREIGN KEY (owner_id) REFERENCES users(user_id)
  ON DELETE CASCADE;

