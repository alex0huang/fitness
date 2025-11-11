const express = require('express');
const { pool } = require('./src/db');

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.render('index');
});

const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await pool.query('SELECT 1');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to establish database connection:', error);
        process.exit(1);
    }
}

const shutdown = async () => {
    try {
        await pool.end();
    } catch (error) {
        console.error('Error while closing database pool:', error);
    } finally {
        process.exit(0);
    }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();
