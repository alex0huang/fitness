-- 创建自动清理旧数据的函数
-- 删除超过指定天数（默认60天）的餐食记录

CREATE OR REPLACE FUNCTION cleanup_old_meals(days_to_keep INTEGER DEFAULT 60)
RETURNS TABLE(deleted_meals INTEGER, deleted_items INTEGER) AS $$
DECLARE
    meals_count INTEGER;
    items_count INTEGER;
BEGIN
    -- 删除超过指定天数的餐食（meal_items 会通过 CASCADE 自动删除）
    WITH deleted AS (
        DELETE FROM meals
        WHERE consumed_at < NOW() - (days_to_keep || ' days')::INTERVAL
        RETURNING id
    )
    SELECT COUNT(*) INTO meals_count FROM deleted;
    
    -- 统计被删除的 meal_items（由于 CASCADE，这些已经被删除了）
    -- 我们需要在删除前统计
    SELECT COUNT(*) INTO items_count
    FROM meal_items mi
    INNER JOIN meals m ON mi.meal_id = m.id
    WHERE m.consumed_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    RETURN QUERY SELECT meals_count, items_count;
END;
$$ LANGUAGE plpgsql;

-- 创建清理日志表（可选，用于记录清理历史）
CREATE TABLE IF NOT EXISTS cleanup_log (
    id SERIAL PRIMARY KEY,
    cleanup_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    days_to_keep INTEGER NOT NULL,
    deleted_meals INTEGER NOT NULL,
    deleted_items INTEGER NOT NULL
);

-- 创建带日志记录的清理函数
CREATE OR REPLACE FUNCTION cleanup_old_meals_with_log(days_to_keep INTEGER DEFAULT 60)
RETURNS TABLE(deleted_meals INTEGER, deleted_items INTEGER) AS $$
DECLARE
    result RECORD;
BEGIN
    -- 执行清理
    SELECT * INTO result FROM cleanup_old_meals(days_to_keep);
    
    -- 记录日志
    INSERT INTO cleanup_log (days_to_keep, deleted_meals, deleted_items)
    VALUES (days_to_keep, result.deleted_meals, result.deleted_items);
    
    RETURN QUERY SELECT result.deleted_meals, result.deleted_items;
END;
$$ LANGUAGE plpgsql;

