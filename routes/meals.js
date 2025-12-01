const express = require('express');
const router = express.Router();
const pool = require('../database');
const { requireAuth } = require('./users');

// 所有路由都需要认证
router.use(requireAuth);

// 获取用户的所有餐食记录
router.get('/', async (req, res) => {
    try {
        const userId = req.userId;
        const { date } = req.query; // 可选：按日期筛选

        let query = `
            SELECT 
                m.id,
                m.title,
                m.consumed_at,
                m.notes,
                m.created_at,
                COALESCE(SUM(mi.calories), 0) as total_calories,
                COALESCE(SUM(mi.protein_grams), 0) as total_protein,
                COALESCE(SUM(mi.carbs_grams), 0) as total_carbs,
                COALESCE(SUM(mi.fat_grams), 0) as total_fat
            FROM meals m
            LEFT JOIN meal_items mi ON m.id = mi.meal_id
            WHERE m.user_id = $1
        `;
        const params = [userId];

        if (date) {
            // 使用UTC日期范围查询，避免时区问题
            // 前端传递的日期是 YYYY-MM-DD 格式，我们将其转换为UTC日期范围
            const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
            // 查询该UTC日期当天的所有记录（从00:00:00到23:59:59 UTC）
            const startDate = new Date(dateStr + 'T00:00:00.000Z');
            const endDate = new Date(dateStr + 'T23:59:59.999Z');
            query += ` AND m.consumed_at >= $2 AND m.consumed_at <= $3`;
            params.push(startDate, endDate);
            console.log('查询日期范围:', dateStr, 'UTC:', startDate.toISOString(), '到', endDate.toISOString());
        }

        query += ` GROUP BY m.id ORDER BY m.consumed_at DESC`;

        const mealsResult = await pool.query(query, params);
        console.log(`查询到 ${mealsResult.rows.length} 个餐食记录`);
        
        // 获取每个餐食的食物项
        const mealsWithItems = await Promise.all(
            mealsResult.rows.map(async (meal) => {
                const itemsResult = await pool.query(
                    'SELECT * FROM meal_items WHERE meal_id = $1 ORDER BY id',
                    [meal.id]
                );
                const mealWithItems = {
                    ...meal,
                    items: itemsResult.rows
                };
                console.log(`Meal ${meal.id} 有 ${itemsResult.rows.length} 个items`);
                return mealWithItems;
            })
        );
        
        console.log(`返回 ${mealsWithItems.length} 个餐食记录（包含items）`);
        res.json(mealsWithItems);
    } catch (error) {
        console.error('Error fetching meals:', error);
        res.status(500).json({ error: '获取餐食记录失败' });
    }
});

// 获取特定餐食的详细信息（包括所有食物项）
router.get('/:mealId', async (req, res) => {
    try {
        const userId = req.userId;
        const mealId = req.params.mealId;

        // 获取餐食基本信息
        const mealResult = await pool.query(
            'SELECT * FROM meals WHERE id = $1 AND user_id = $2',
            [mealId, userId]
        );

        if (mealResult.rows.length === 0) {
            return res.status(404).json({ error: '餐食记录不存在' });
        }

        // 获取该餐食的所有食物项
        const itemsResult = await pool.query(
            'SELECT * FROM meal_items WHERE meal_id = $1 ORDER BY created_at',
            [mealId]
        );

        const meal = mealResult.rows[0];
        meal.items = itemsResult.rows;

        // 计算总营养
        const totals = itemsResult.rows.reduce((acc, item) => {
            acc.calories += item.calories || 0;
            acc.protein += parseFloat(item.protein_grams) || 0;
            acc.carbs += parseFloat(item.carbs_grams) || 0;
            acc.fat += parseFloat(item.fat_grams) || 0;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

        meal.totals = totals;

        res.json(meal);
    } catch (error) {
        console.error('Error fetching meal:', error);
        res.status(500).json({ error: '获取餐食详情失败' });
    }
});

// 创建新的餐食记录
router.post('/', async (req, res) => {
    try {
        const userId = req.userId;
        const { title, consumed_at, notes, items } = req.body;

        if (!title) {
            return res.status(400).json({ error: '餐食标题不能为空' });
        }

        // 如果没有提供consumed_at，使用当前时间
        const consumedAt = consumed_at ? new Date(consumed_at) : new Date();

        // 开始事务
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 插入餐食记录
            const mealResult = await client.query(
                `INSERT INTO meals (user_id, title, consumed_at, notes)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [userId, title, consumedAt, notes || null]
            );

            const meal = mealResult.rows[0];
            const mealId = meal.id;

            // 如果有食物项，插入它们
            if (items && Array.isArray(items) && items.length > 0) {
                for (const item of items) {
                    await client.query(
                        `INSERT INTO meal_items 
                         (meal_id, food_name, serving_size, calories, protein_grams, carbs_grams, fat_grams)
                         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [
                            mealId,
                            item.food_name || item.foodName || '',
                            item.serving_size || item.servingSize || null,
                            item.calories || 0,
                            item.protein_grams || item.proteinGrams || 0,
                            item.carbs_grams || item.carbsGrams || 0,
                            item.fat_grams || item.fatGrams || 0
                        ]
                    );
                }
            }

            await client.query('COMMIT');

            // 返回完整的餐食记录（包括食物项）
            const fullMealResult = await pool.query(
                `SELECT m.*, 
                        COALESCE(SUM(mi.calories), 0) as total_calories,
                        COALESCE(SUM(mi.protein_grams), 0) as total_protein,
                        COALESCE(SUM(mi.carbs_grams), 0) as total_carbs,
                        COALESCE(SUM(mi.fat_grams), 0) as total_fat
                 FROM meals m
                 LEFT JOIN meal_items mi ON m.id = mi.meal_id
                 WHERE m.id = $1
                 GROUP BY m.id`,
                [mealId]
            );

            const itemsResult = await pool.query(
                'SELECT * FROM meal_items WHERE meal_id = $1',
                [mealId]
            );

            const fullMeal = fullMealResult.rows[0];
            fullMeal.items = itemsResult.rows;

            res.status(201).json(fullMeal);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating meal:', error);
        res.status(500).json({ error: '创建餐食记录失败' });
    }
});

// 向现有餐食添加食物项
router.post('/:mealId/items', async (req, res) => {
    try {
        const userId = req.userId;
        const mealId = req.params.mealId;
        const { food_name, serving_size, calories, protein_grams, carbs_grams, fat_grams } = req.body;

        // 验证餐食属于当前用户
        const mealCheck = await pool.query(
            'SELECT id FROM meals WHERE id = $1 AND user_id = $2',
            [mealId, userId]
        );

        if (mealCheck.rows.length === 0) {
            return res.status(404).json({ error: '餐食记录不存在' });
        }

        if (!food_name) {
            return res.status(400).json({ error: '食物名称不能为空' });
        }

        const result = await pool.query(
            `INSERT INTO meal_items 
             (meal_id, food_name, serving_size, calories, protein_grams, carbs_grams, fat_grams)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                mealId,
                food_name,
                serving_size || null,
                calories || 0,
                protein_grams || 0,
                carbs_grams || 0,
                fat_grams || 0
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding meal item:', error);
        res.status(500).json({ error: '添加食物项失败' });
    }
});

// 更新餐食记录
router.put('/:mealId', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const userId = req.userId;
        const mealId = req.params.mealId;
        const { title, consumed_at, notes, items } = req.body;

        // 验证餐食属于当前用户
        const mealCheck = await client.query(
            'SELECT id FROM meals WHERE id = $1 AND user_id = $2',
            [mealId, userId]
        );

        if (mealCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: '餐食记录不存在' });
        }

        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (title !== undefined) {
            updateFields.push(`title = $${paramIndex++}`);
            values.push(title);
        }
        if (consumed_at !== undefined) {
            updateFields.push(`consumed_at = $${paramIndex++}`);
            values.push(new Date(consumed_at));
        }
        if (notes !== undefined) {
            updateFields.push(`notes = $${paramIndex++}`);
            values.push(notes);
        }

        if (updateFields.length > 0) {
            updateFields.push(`updated_at = NOW()`);
            values.push(mealId);
            values.push(userId);

            await client.query(
                `UPDATE meals 
                 SET ${updateFields.join(', ')}
                 WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}`,
                values
            );
        }

        // 如果提供了items，更新食物项（即使items为空数组也要处理）
        if (items !== undefined && Array.isArray(items)) {
            console.log(`更新meal ${mealId} 的items - 收到${items.length}个items`);
            console.log('Items数据:', JSON.stringify(items, null, 2));
            
            // 删除所有旧的食物项
            const deleteResult = await client.query('DELETE FROM meal_items WHERE meal_id = $1', [mealId]);
            console.log(`删除了${deleteResult.rowCount}个旧items`);
            
            // 插入新的食物项（只插入有效的食物项）
            const validItems = items.filter(item => {
                const isValid = item && item.food_name && typeof item.food_name === 'string' && item.food_name.trim().length > 0;
                if (!isValid) {
                    console.log('过滤掉的无效item:', item);
                }
                return isValid;
            });
            
            console.log(`有效items数量: ${validItems.length}`);
            
            for (let i = 0; i < validItems.length; i++) {
                const item = validItems[i];
                // 确保数值正确转换，处理空字符串、null、undefined
                const calories = (item.calories === '' || item.calories === null || item.calories === undefined) 
                    ? 0 
                    : (parseInt(String(item.calories)) || 0);
                const protein = (item.protein_grams === '' || item.protein_grams === null || item.protein_grams === undefined) 
                    ? 0 
                    : (parseFloat(String(item.protein_grams)) || 0);
                const carbs = (item.carbs_grams === '' || item.carbs_grams === null || item.carbs_grams === undefined) 
                    ? 0 
                    : (parseFloat(String(item.carbs_grams)) || 0);
                const fat = (item.fat_grams === '' || item.fat_grams === null || item.fat_grams === undefined) 
                    ? 0 
                    : (parseFloat(String(item.fat_grams)) || 0);
                
                console.log(`插入item ${i + 1}:`, {
                    food_name: item.food_name.trim(),
                    calories: calories,
                    protein: protein,
                    carbs: carbs,
                    fat: fat
                });
                
                const insertResult = await client.query(
                    `INSERT INTO meal_items 
                     (meal_id, food_name, serving_size, calories, protein_grams, carbs_grams, fat_grams)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     RETURNING id`,
                    [
                        mealId,
                        item.food_name.trim(),
                        item.serving_size || null,
                        calories,
                        protein,
                        carbs,
                        fat
                    ]
                );
                console.log(`成功插入item，ID: ${insertResult.rows[0].id}`);
            }
            
            console.log(`meal ${mealId} 的items更新完成，共插入${validItems.length}个items`);
        }

        await client.query('COMMIT');

        // 返回完整的餐食记录（包括食物项）
        const fullMealResult = await pool.query(
            `SELECT m.*, 
                    COALESCE(SUM(mi.calories), 0) as total_calories,
                    COALESCE(SUM(mi.protein_grams), 0) as total_protein,
                    COALESCE(SUM(mi.carbs_grams), 0) as total_carbs,
                    COALESCE(SUM(mi.fat_grams), 0) as total_fat
             FROM meals m
             LEFT JOIN meal_items mi ON m.id = mi.meal_id
             WHERE m.id = $1
             GROUP BY m.id`,
            [mealId]
        );

        const itemsResult = await pool.query(
            'SELECT * FROM meal_items WHERE meal_id = $1 ORDER BY id',
            [mealId]
        );

        const fullMeal = fullMealResult.rows[0];
        fullMeal.items = itemsResult.rows;

        res.json(fullMeal);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating meal:', error);
        res.status(500).json({ error: '更新餐食记录失败' });
    } finally {
        client.release();
    }
});

// 删除餐食记录（级联删除所有食物项）
router.delete('/:mealId', async (req, res) => {
    try {
        const userId = req.userId;
        const mealId = req.params.mealId;

        // 验证餐食属于当前用户
        const mealCheck = await pool.query(
            'SELECT id FROM meals WHERE id = $1 AND user_id = $2',
            [mealId, userId]
        );

        if (mealCheck.rows.length === 0) {
            return res.status(404).json({ error: '餐食记录不存在' });
        }

        await pool.query('DELETE FROM meals WHERE id = $1', [mealId]);

        res.json({ message: '餐食记录已删除' });
    } catch (error) {
        console.error('Error deleting meal:', error);
        res.status(500).json({ error: '删除餐食记录失败' });
    }
});

// 更新食物项
router.put('/:mealId/items/:itemId', async (req, res) => {
    try {
        const userId = req.userId;
        const mealId = req.params.mealId;
        const itemId = req.params.itemId;
        const { food_name, serving_size, calories, protein_grams, carbs_grams, fat_grams } = req.body;

        // 验证餐食属于当前用户
        const mealCheck = await pool.query(
            'SELECT id FROM meals WHERE id = $1 AND user_id = $2',
            [mealId, userId]
        );

        if (mealCheck.rows.length === 0) {
            return res.status(404).json({ error: '餐食记录不存在' });
        }

        // 验证食物项属于该餐食
        const itemCheck = await pool.query(
            'SELECT id FROM meal_items WHERE id = $1 AND meal_id = $2',
            [itemId, mealId]
        );

        if (itemCheck.rows.length === 0) {
            return res.status(404).json({ error: '食物项不存在' });
        }

        if (!food_name) {
            return res.status(400).json({ error: '食物名称不能为空' });
        }

        const result = await pool.query(
            `UPDATE meal_items 
             SET food_name = $1, 
                 serving_size = $2, 
                 calories = $3, 
                 protein_grams = $4, 
                 carbs_grams = $5, 
                 fat_grams = $6,
                 updated_at = NOW()
             WHERE id = $7
             RETURNING *`,
            [
                food_name,
                serving_size || null,
                calories || 0,
                protein_grams || 0,
                carbs_grams || 0,
                fat_grams || 0,
                itemId
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating meal item:', error);
        res.status(500).json({ error: '更新食物项失败' });
    }
});

// 删除食物项
router.delete('/:mealId/items/:itemId', async (req, res) => {
    try {
        const userId = req.userId;
        const mealId = req.params.mealId;
        const itemId = req.params.itemId;

        // 验证餐食属于当前用户
        const mealCheck = await pool.query(
            'SELECT id FROM meals WHERE id = $1 AND user_id = $2',
            [mealId, userId]
        );

        if (mealCheck.rows.length === 0) {
            return res.status(404).json({ error: '餐食记录不存在' });
        }

        // 验证食物项属于该餐食
        const itemCheck = await pool.query(
            'SELECT id FROM meal_items WHERE id = $1 AND meal_id = $2',
            [itemId, mealId]
        );

        if (itemCheck.rows.length === 0) {
            return res.status(404).json({ error: '食物项不存在' });
        }

        await pool.query('DELETE FROM meal_items WHERE id = $1', [itemId]);

        res.json({ message: '食物项已删除' });
    } catch (error) {
        console.error('Error deleting meal item:', error);
        res.status(500).json({ error: '删除食物项失败' });
    }
});

// 获取用户今日热量统计
router.get('/stats/today', async (req, res) => {
    try {
        const userId = req.userId;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const result = await pool.query(
            `SELECT 
                COALESCE(SUM(mi.calories), 0) as total_calories,
                COALESCE(SUM(mi.protein_grams), 0) as total_protein,
                COALESCE(SUM(mi.carbs_grams), 0) as total_carbs,
                COALESCE(SUM(mi.fat_grams), 0) as total_fat,
                COUNT(DISTINCT m.id) as meal_count
             FROM meals m
             LEFT JOIN meal_items mi ON m.id = mi.meal_id
             WHERE m.user_id = $1 AND DATE(m.consumed_at) = $2`,
            [userId, today]
        );

        // 获取用户的目标值
        const userResult = await pool.query(
            'SELECT daily_calorie_limit, daily_protein_limit, daily_carbs_limit, daily_fat_limit FROM users WHERE id = $1',
            [userId]
        );

        const stats = result.rows[0];
        const limits = userResult.rows[0] || {};

        res.json({
            date: today,
            consumed: {
                calories: parseInt(stats.total_calories) || 0,
                protein: parseFloat(stats.total_protein) || 0,
                carbs: parseFloat(stats.total_carbs) || 0,
                fat: parseFloat(stats.total_fat) || 0,
                meal_count: parseInt(stats.meal_count) || 0
            },
            limits: {
                calories: limits.daily_calorie_limit || null,
                protein: limits.daily_protein_limit || null,
                carbs: limits.daily_carbs_limit || null,
                fat: limits.daily_fat_limit || null
            }
        });
    } catch (error) {
        console.error('Error fetching today stats:', error);
        res.status(500).json({ error: '获取今日统计失败' });
    }
});

module.exports = router;

