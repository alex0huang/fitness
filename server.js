const express = require('express');
const session = require('express-session');
const app = express();
const pool = require('./database');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // 支持JSON请求体

// 配置session
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // 生产环境使用HTTPS时设为true
        maxAge: 24 * 60 * 60 * 1000 // 24小时
    }
}));

app.get('/', (req, res) => {
    res.render('index');    
});

const usersRouter = require('./routes/users');
app.use('/users', usersRouter); 

const mealsRouter = require('./routes/meals');
app.use('/meals', mealsRouter);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});