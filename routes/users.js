const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../src/db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, email, display_name, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Failed to list users:', error);
        res.status(500).send('无法获取用户列表');
    }
});

router.get('/new', (req, res) => {
    res.render('users/new', { email: '', displayName: '' });
});

router.post('/', async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const displayName = (req.body.displayName || '').trim();
    const password = req.body.password || '';

    if (!email) {
        return res.render('users/new', {
            email,
            displayName,
            error: '邮箱不能为空'
        });
    }

    if (!password) {
        return res.render('users/new', {
            email,
            displayName,
            error: '密码不能为空'
        });
    }

    try {
        const existingUser = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
        if (existingUser.rowCount > 0) {
            return res.render('users/new', {
                email,
                displayName,
                error: '该邮箱已注册'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { rows } = await pool.query(
            'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id',
            [email, hashedPassword, displayName || null]
        );

        res.redirect(`/users/${rows[0].id}`);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).render('users/new', {
            email,
            displayName,
            error: '创建用户时发生错误'
        });
    }
});

router.get('/login', (req, res) => {
    res.render('users/login', { email: '' });
});

router.post('/login', async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
        return res.render('users/login', {
            email,
            error: '邮箱和密码均不能为空'
        });
    }

    try {
        const { rows } = await pool.query(
            'SELECT id, password_hash, display_name FROM users WHERE email = $1',
            [email]
        );

        if (rows.length === 0) {
            return res.render('users/login', {
                email,
                error: '用户不存在'
            });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.render('users/login', {
                email,
                error: '密码错误'
            });
        }

        res.send(`登录成功，欢迎 ${user.display_name || email}`);
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).render('users/login', {
            email,
            error: '登录时发生错误'
        });
    }
});

router.route('/:id')
    .get(async (req, res) => {
        try {
            const { rows } = await pool.query(
                'SELECT id, email, display_name, created_at, updated_at FROM users WHERE id = $1',
                [req.params.id]
            );

            if (rows.length === 0) {
                return res.status(404).send('用户不存在');
            }

            res.json(rows[0]);
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).send('获取用户信息时发生错误');
        }
    })
    .delete(async (req, res) => {
        try {
            const result = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
            if (result.rowCount === 0) {
                return res.status(404).send('用户不存在');
            }

            res.sendStatus(204);
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).send('删除用户时发生错误');
        }
    })
    .put(async (req, res) => {
        const displayName = (req.body.displayName || '').trim();

        if (!displayName) {
            return res.status(400).json({ error: 'displayName 不能为空' });
        }

        try {
            const { rows } = await pool.query(
                'UPDATE users SET display_name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, display_name, updated_at',
                [displayName, req.params.id]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: '用户不存在' });
            }

            res.json(rows[0]);
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ error: '更新用户时发生错误' });
        }
    });

router.param('id', (req, res, next, id) => {
    console.log(`Handling user ${id}`);
    next();
});

module.exports = router;
