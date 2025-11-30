const express = require('express');
const session = require('express-session');
const cors = require('cors');
const app = express();
const pool = require('./database');

// 配置 CORS - 允许前端访问
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
    origin: frontendUrl,
    credentials: true, // 允许发送 cookies/session
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
}));

// 处理 OPTIONS 预检请求
app.options('*', cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // 支持JSON请求体

// 配置session
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    resave: true, // 改为 true，确保 session 被保存
    saveUninitialized: true, // 改为 true，即使没有修改也保存
    name: 'connect.sid', // 明确指定 session cookie 名称
    cookie: { 
        secure: isProduction, // 生产环境使用HTTPS时设为true
        maxAge: 24 * 60 * 60 * 1000, // 24小时
        sameSite: isProduction ? 'none' : 'lax', // 跨域时需要 'none'
        httpOnly: true, // 防止 XSS 攻击
        path: '/', // 确保 cookie 在所有路径都可用
        // 注意：跨域时不要设置 domain，让浏览器自动处理
    }
}));

// 调试：打印配置信息
if (isProduction) {
    console.log('生产环境配置:');
    console.log('FRONTEND_URL:', frontendUrl);
    console.log('NODE_ENV:', process.env.NODE_ENV);
}

// API 根路径
app.get('/', (req, res) => {
    res.json({ message: 'Fitness Tracker API' });
});

const usersRouter = require('./routes/users');
app.use('/users', usersRouter); 

const mealsRouter = require('./routes/meals');
app.use('/meals', mealsRouter);

// 管理路由（用于数据库维护）
const adminRouter = require('./routes/admin');
app.use('/admin', adminRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});