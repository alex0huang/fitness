/**
 * 数据库迁移脚本
 * 使用方法: node scripts/run-migration.js [迁移文件名]
 * 例如: node scripts/run-migration.js 002_auto_cleanup_function.sql
 */

const path = require('path');
const { readFile } = require('fs/promises');
const { Client } = require('pg');

async function runMigration(migrationFile) {
    const connectionString =
        process.env.DATABASE_URL ||
        `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'fitness'}`;

    const migrationPath = path.resolve(__dirname, 'migrations', migrationFile);
    const sql = await readFile(migrationPath, 'utf8');

    const client = new Client({
        connectionString,
        ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require') 
            ? { rejectUnauthorized: false } 
            : false
    });

    try {
        await client.connect();
        console.log(`正在执行迁移: ${migrationFile}`);
        await client.query(sql);
        console.log(`迁移完成: ${migrationFile}`);
    } catch (error) {
        console.error(`迁移失败: ${migrationFile}`, error);
        throw error;
    } finally {
        await client.end();
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const migrationFile = process.argv[2];
    
    if (!migrationFile) {
        console.error('请指定迁移文件名');
        console.log('使用方法: node scripts/run-migration.js [迁移文件名]');
        console.log('例如: node scripts/run-migration.js 002_auto_cleanup_function.sql');
        process.exit(1);
    }
    
    runMigration(migrationFile)
        .then(() => {
            console.log('迁移脚本执行完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('迁移脚本执行失败:', error);
            process.exit(1);
        });
}

module.exports = { runMigration };

