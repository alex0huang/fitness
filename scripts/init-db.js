const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

async function run() {
    const sqlPath = path.resolve(__dirname, '..', 'database.sql');

    try {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        if (!sql.trim()) {
            throw new Error('database.sql is empty.');
        }

        await pool.query(sql);
        console.log('Database schema has been initialized.');
    } catch (error) {
        console.error('Failed to initialize database schema:', error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

run();
