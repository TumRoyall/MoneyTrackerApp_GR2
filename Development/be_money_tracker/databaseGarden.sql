-- ===========================
-- FINANCIAL GARDEN MODULE
-- ===========================

-- Flower types (seed catalog in DB)
CREATE TABLE flower_types (
    flower_type_id  CHAR(36) PRIMARY KEY,
    code            VARCHAR(30) NOT NULL UNIQUE,
    display_name    VARCHAR(255) NOT NULL,
    description     TEXT,
    is_active       TINYINT NOT NULL DEFAULT 1,
    created_at      DATETIME(6) NOT NULL,
    updated_at      DATETIME(6) NOT NULL,
    version         BIGINT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Plant sessions (one per user per month)
CREATE TABLE plant_sessions (
    plant_session_id  CHAR(36) PRIMARY KEY,
    user_id           CHAR(36) NOT NULL,
    flower_type_id    CHAR(36) NOT NULL,
    month_start       DATE NOT NULL,
    month_end         DATE NOT NULL,
    seed_selected_date DATE,
    status            VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    current_stage     VARCHAR(30) NOT NULL DEFAULT 'SEED',
    current_quality   VARCHAR(20) NOT NULL DEFAULT 'AVERAGE',
    current_score     INT NOT NULL DEFAULT 0,
    mutation_type     VARCHAR(30) NOT NULL DEFAULT 'NONE',
    final_rank        VARCHAR(30),
    final_score       INT,
    final_savings_ratio DECIMAL(6,4),
    finalized_at      DATETIME(6),
    archived_at       DATETIME(6),
    created_at        DATETIME(6) NOT NULL,
    updated_at        DATETIME(6) NOT NULL,
    version           BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT uk_plant_sessions_user_month UNIQUE (user_id, month_start),
    CONSTRAINT fk_plant_sessions_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_plant_sessions_flower_type FOREIGN KEY (flower_type_id) REFERENCES flower_types(flower_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_plant_sessions_user ON plant_sessions(user_id);
CREATE INDEX idx_plant_sessions_user_month ON plant_sessions(user_id, month_start);
CREATE INDEX idx_plant_sessions_status ON plant_sessions(status);

-- Daily financial tasks
CREATE TABLE daily_financial_tasks (
    task_id           CHAR(36) PRIMARY KEY,
    user_id           CHAR(36) NOT NULL,
    plant_session_id  CHAR(36),
    task_date         DATE NOT NULL,
    task_type         VARCHAR(40) NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    score_delta       INT NOT NULL DEFAULT 0,
    xp_reward         INT NOT NULL DEFAULT 0,
    is_random         TINYINT NOT NULL DEFAULT 0,
    completed_at      DATETIME(6),
    created_at        DATETIME(6) NOT NULL,
    updated_at        DATETIME(6) NOT NULL,
    version           BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT uk_task_user_date_type UNIQUE (user_id, task_date, task_type),
    CONSTRAINT fk_task_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_task_session FOREIGN KEY (plant_session_id) REFERENCES plant_sessions(plant_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_task_user_date ON daily_financial_tasks(user_id, task_date);
CREATE INDEX idx_task_session ON daily_financial_tasks(plant_session_id);

-- Plant stage snapshots (growth timeline)
CREATE TABLE plant_stage_snapshots (
    snapshot_id       CHAR(36) PRIMARY KEY,
    plant_session_id  CHAR(36) NOT NULL,
    snapshot_date     DATE NOT NULL,
    day_of_month      INT NOT NULL,
    stage             VARCHAR(30) NOT NULL,
    quality           VARCHAR(20) NOT NULL,
    score             INT NOT NULL,
    is_finalized      TINYINT NOT NULL DEFAULT 0,
    created_at        DATETIME(6) NOT NULL,
    version           BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT uk_snapshot_session_date UNIQUE (plant_session_id, snapshot_date),
    CONSTRAINT fk_snapshot_session FOREIGN KEY (plant_session_id) REFERENCES plant_sessions(plant_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_snapshot_session ON plant_stage_snapshots(plant_session_id);
CREATE INDEX idx_snapshot_session_date ON plant_stage_snapshots(plant_session_id, snapshot_date);

-- User garden streaks
CREATE TABLE user_garden_streaks (
    streak_id          CHAR(36) PRIMARY KEY,
    user_id            CHAR(36) NOT NULL,
    current_streak     INT NOT NULL DEFAULT 0,
    longest_streak     INT NOT NULL DEFAULT 0,
    last_completed_date DATE,
    last_rewarded_at   DATETIME(6),
    created_at         DATETIME(6) NOT NULL,
    updated_at         DATETIME(6) NOT NULL,
    version            BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT uk_garden_streak_user UNIQUE (user_id),
    CONSTRAINT fk_streak_user FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_garden_streak_user ON user_garden_streaks(user_id);

-- Garden rewards
CREATE TABLE garden_rewards (
    reward_id         CHAR(36) PRIMARY KEY,
    user_id           CHAR(36) NOT NULL,
    plant_session_id  CHAR(36),
    reward_type       VARCHAR(40) NOT NULL,
    reward_value      INT NOT NULL DEFAULT 0,
    reward_payload    TEXT,
    source            VARCHAR(60),
    created_at        DATETIME(6) NOT NULL,
    version           BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT fk_reward_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_reward_session FOREIGN KEY (plant_session_id) REFERENCES plant_sessions(plant_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_garden_rewards_user ON garden_rewards(user_id);
CREATE INDEX idx_garden_rewards_session ON garden_rewards(plant_session_id);

-- ===========================
-- SEED DATA — FlowerTypes
-- ===========================
INSERT INTO flower_types (flower_type_id, code, display_name, description, is_active, created_at, updated_at)
VALUES
    (UUID(), 'SAKURA',    'Sakura Hiểu Thư', 'Mang lại cảm giác dịu dàng và dễ chịu', 1, NOW(), NOW()),
    (UUID(), 'LILY',      'Dải Nguyệt',      'Vẻ đẹp tinh tế, phù hợp khi bạn đang giữ nhịp tiết kiệm', 1, NOW(), NOW()),
    (UUID(), 'SUNFLOWER', 'Bình Minh',        'Nắng ấm, mềm mại và luôn động viên', 1, NOW(), NOW()),
    (UUID(), 'ROSE',      'Sen Thắm',         'Hoa sen quý, dành cho những tháng kỷ luật cao', 1, NOW(), NOW()),
    (UUID(), 'TULIP',     'Cúc Aurora',        'Rực rỡ và đầy hi vọng', 1, NOW(), NOW()),
    (UUID(), 'LAVENDER',  'Lavender',          'Hương thơm nhẹ nhàng', 1, NOW(), NOW());
