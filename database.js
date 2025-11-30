const Pool = require('pg').Pool;

// 如果提供了 DATABASE_URL（连接字符串），优先使用它
// 否则使用单独的环境变量
const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    }
    : {
        user: process.env.DB_USER || 'huangjiasheng',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'fitness',
        port: process.env.DB_PORT || 5432,
        password: process.env.DB_PASSWORD,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };

const pool = new Pool(poolConfig);

module.exports = pool;