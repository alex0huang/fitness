-- 初始数据库结构
-- 这个文件已经通过 init-db.js 应用，保留作为参考

BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    daily_calorie_limit INTEGER,
    daily_protein_limit NUMERIC(10,2),
    daily_carbs_limit NUMERIC(10,2),
    daily_fat_limit NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    consumed_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_meals_user FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meal_items (
    id SERIAL PRIMARY KEY,
    meal_id INTEGER NOT NULL,
    food_name TEXT NOT NULL,
    serving_size TEXT,
    calories INTEGER,
    protein_grams NUMERIC(10,2),
    carbs_grams NUMERIC(10,2),
    fat_grams NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_meal_items_meal FOREIGN KEY (meal_id)
        REFERENCES meals (id)
        ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals (user_id);
CREATE INDEX IF NOT EXISTS idx_meals_consumed_at ON meals (consumed_at);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON meal_items (meal_id);

COMMIT;

