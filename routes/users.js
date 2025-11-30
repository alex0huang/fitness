const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../database');

// 认证中间件 - 检查用户是否已登录
const requireAuth = (req, res, next) => {
    // 调试信息
    console.log('认证检查 - Session ID:', req.sessionID);
    console.log('认证检查 - Session:', req.session);
    console.log('认证检查 - Cookies:', req.headers.cookie);
    
    if (req.session && req.session.userId) {
        req.userId = req.session.userId;
        req.userEmail = req.session.userEmail;
        next();
    } else {
        // 如果是API请求（JSON或Accept头包含application/json），返回JSON错误
        const isApiRequest = req.headers['content-type'] === 'application/json' || 
                            req.headers['accept']?.includes('application/json') ||
                            req.path.startsWith('/api');
        
        if (isApiRequest) {
            return res.status(401).json({ error: '未授权，请先登录' });
        }
        // 如果是页面请求，重定向到登录页
        res.redirect('/users/login');
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

// 登出
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: '登出失败' });
        }
        res.json({ message: '登出成功' });
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: '登出失败' });
        }
        res.json({ message: '登出成功' });
    });
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

        // 设置session
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        
        // 手动保存 session（确保在返回响应前保存）
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) {
                    console.error('Session保存失败:', err);
                    reject(err);
                } else {
                    console.log('登录成功 - Session ID:', req.sessionID);
                    console.log('登录成功 - Session:', req.session);
                    resolve();
                }
            });
        });

        return res.json({ 
            message: '登录成功',
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

//route chaining - 必须在 /me 路由之后
router.route('/:id')
    .get((req, res) => {
        res.send(`User ${req.params.id}`);
    })
    .delete((req, res) => {
        res.send(`User ${req.params.id} deleted`);
    })
    .put((req, res) => {
        res.send(`User ${req.params.id} updated`);
    });

router.param('id', (req, res, next,id) => {
    console.log(id);
    next(); 
});

// 导出认证中间件供其他路由使用
module.exports = router;
module.exports.requireAuth = requireAuth;