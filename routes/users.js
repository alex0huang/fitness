const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const users = [];
router.get('/', (req, res) => {
    res.send('Users');
});

router.get('/new', (req, res) => {
    res.render('users/new');
});

router.post('/', async (req, res) => {
    const isValid = true;
    if(isValid){
        try {
            const password = req.body.password || req.body.passward || '';
            if (!password) {
                return res.render('users/new', { firstname: req.body.firstname, error: '密码不能为空' });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            users.push({ 
                firstname: req.body.firstname,
                password: hashedPassword 
            });
            res.redirect(`/users/${req.body.firstname}`);
        } catch (error) {
            console.log('Error hashing password:', error);
             res.render('users/new', { firstname: req.body.firstname, error: '创建用户时发生错误' });
        }
    } else {
        console.log('Error');
        res.render('users/new', { firstname: req.body.firstname });
    } 
});
router.get('/login', (req, res) => {
    res.render('users/login');
});

router.post('/login', async (req, res) => {
    const user = users.find(user => user.firstname === req.body.firstname);
    if(!user){
        return res.render('users/login', { firstname: req.body.firstname, error: '用户不存' });
    }
    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if(isPasswordValid){
        res.send('登录成功');
    } else {
        return res.render('users/login', { firstname: req.body.firstname, error: '密码错误' });
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
module.exports = router;