const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../database');

// 认证中间件 - 检查用户是否已登录
const requireAuth = (req, res, next) => {
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

router.get('/new', (req, res) => {
    res.render('users/new');
});

// 注册用户
router.post('/', async (req, res) => {
    try {
        const email = req.body.email || req.body.firstname; // 兼容firstname字段
        const password = req.body.password || req.body.passward || '';
        
        if (!email || !password) {
            return res.render('users/new', { 
                firstname: email, 
                error: '邮箱和密码不能为空' 
            });
        }

        // 检查用户是否已存在
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.render('users/new', { 
                firstname: email, 
                error: '该邮箱已被注册' 
            });
        }

        // 加密密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 插入数据库
        const result = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, hashedPassword]
        );

        res.redirect(`/users/login`);
    } catch (error) {
        console.error('Error creating user:', error);
        res.render('users/new', { 
            firstname: req.body.email || req.body.firstname, 
            error: '创建用户时发生错误' 
        });
    }
});

// 登录页面
router.get('/login', (req, res) => {
    res.render('users/login');
});

// 登出
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: '登出失败' });
        }
        if (req.headers['content-type'] === 'application/json') {
            res.json({ message: '登出成功' });
        } else {
            res.redirect('/users/login');
        }
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: '登出失败' });
        }
        res.redirect('/users/login');
    });
});

// 登录处理
router.post('/login', async (req, res) => {
    try {
        const email = req.body.email || req.body.firstname; // 兼容firstname字段
        const password = req.body.password || '';

        if (!email || !password) {
            return res.render('users/login', { 
                firstname: email, 
                error: '邮箱和密码不能为空' 
            });
        }

        // 从数据库查找用户
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.render('users/login', { 
                firstname: email, 
                error: '用户不存在' 
            });
        }

        const user = result.rows[0];

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
            return res.render('users/login', { 
                firstname: email, 
                error: '密码错误' 
            });
        }

        // 设置session
        req.session.userId = user.id;
        req.session.userEmail = user.email;

        // 返回JSON格式（API调用）或重定向（表单提交）
        if (req.headers['content-type'] === 'application/json') {
            res.json({ 
                message: '登录成功',
                user: {
                    id: user.id,
                    email: user.email
                }
            });
        } else {
            // 表单提交，重定向到首页
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.render('users/login', { 
            firstname: req.body.email || req.body.firstname, 
            error: '登录时发生错误' 
        });
    }
});

//route chaining
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