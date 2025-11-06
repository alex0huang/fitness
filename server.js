const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('index');    
});

const usersRouter = require('./routes/users');
app.use('/users', usersRouter); 

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});