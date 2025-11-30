const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../database');

// JWT 密钥（生产环境应该使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'your-jwt-secret-change-in-production';

// 认证中间件 - 检查 JWT token
const requireAuth = (req, res, next) => {
    try {
        // 从请求头获取 token
        const authHeader = req.headers.authorization;
        console.log('认证检查 - Authorization 头:', authHeader ? authHeader.substring(0, 30) + '...' : '无');
        
        const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
        
        if (!token) {
            console.log('认证失败 - 没有 token');
            console.log('请求头:', JSON.stringify(req.headers, null, 2));
            return res.status(401).json({ error: '未授权，请先登录' });
        }
        
        console.log('找到 token，开始验证:', token.substring(0, 20) + '...');
        
        // 验证 token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        
        console.log('认证成功 - User ID:', req.userId);
        next();
    } catch (error) {
        console.log('认证失败 - Token 验证失败:', error.message);
        console.log('错误详情:', error);
        return res.status(401).json({ error: '未授权，请先登录' });
    }
};

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, daily_calorie_limit, created_at FROM users');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: '获取用户列表失败' });
    }
});

// 注册页面路由已由 React Router 处理，这里不再需要
// router.get('/new', (req, res) => {
//     res.render('users/new');
// });

// 注册用户
router.post('/', async (req, res) => {
    try {
        const email = req.body.email || req.body.firstname; // 兼容firstname字段
        const password = req.body.password || req.body.passward || '';
        if (!email || !password) {
            return res.status(400).json({ error: '邮箱和密码不能为空' });
        }

        // 检查用户是否已存在
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: '该邮箱已被注册' });
        }

        // 加密密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 插入数据库
        const result = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, hashedPassword]
        );

        return res.json({ 
            message: '注册成功',
            user: {
                id: result.rows[0].id,
                email: result.rows[0].email
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ error: '创建用户时发生错误' });
    }
});

// 登录页面路由已由 React Router 处理，这里不再需要
// router.get('/login', (req, res) => {
//     res.render('users/login');
// });

// 登出（JWT 方案中，登出主要是前端删除 token）
router.post('/logout', (req, res) => {
    res.json({ message: '登出成功' });
});

router.get('/logout', (req, res) => {
    res.json({ message: '登出成功' });
});

// 登录处理
router.post('/login', async (req, res) => {
    try {
        const email = req.body.email || req.body.firstname; // 兼容firstname字段
        const password = req.body.password || '';

        if (!email || !password) {
            return res.status(400).json({ error: '邮箱和密码不能为空' });
        }

        // 从数据库查找用户
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: '用户不存在' });
        }

        const user = result.rows[0];

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: '密码错误' });
        }

        // 生成 JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email 
            },
            JWT_SECRET,
            { expiresIn: '7d' } // token 7天后过期
        );

        console.log('登录成功 - User ID:', user.id);
        console.log('JWT Token 已生成');

        return res.json({ 
            message: '登录成功',
            token: token, // 返回 token
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ error: '登录时发生错误' });
    }
});

// 获取当前用户信息（包括目标）- 必须在 /:id 路由之前
router.get('/me', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await pool.query(
            'SELECT id, email, daily_calorie_limit, daily_protein_limit, daily_carbs_limit, daily_fat_limit, created_at FROM users WHERE id = $1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '用户不存在' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: '获取用户信息失败' });
    }
});

// 更新用户目标
router.put('/me/goals', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { daily_calorie_limit, daily_protein_limit, daily_carbs_limit, daily_fat_limit } = req.body;
        
        const result = await pool.query(
            `UPDATE users 
             SET daily_calorie_limit = $1, 
                 daily_protein_limit = $2, 
                 daily_carbs_limit = $3, 
                 daily_fat_limit = $4,
                 updated_at = NOW()
             WHERE id = $5
             RETURNING id, email, daily_calorie_limit, daily_protein_limit, daily_carbs_limit, daily_fat_limit`,
            [daily_calorie_limit || null, daily_protein_limit || null, daily_carbs_limit || null, daily_fat_limit || null, userId]
        );
        
        res.json({
            message: '目标更新成功',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating goals:', error);
        res.status(500).json({ error: '更新目标失败' });
    }
});

// 简单的用户路由（如果需要的话）
router.get('/:id', (req, res) => {
    res.json({ id: req.params.id, message: 'User endpoint' });
});

// 导出认证中间件供其他路由使用
module.exports = router;
module.exports.requireAuth = requireAuth;