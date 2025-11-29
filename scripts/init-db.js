const path = require('path');
const { readFile } = require('fs/promises');
const { Client } = require('pg');

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgres://localhost:5432/fitness';

  const sqlFilePath = path.resolve(__dirname, '..', 'database.sql');
  const sql = await readFile(sqlFilePath, 'utf8');

  const client = new Client({ connectionString });

  try {
    await client.connect();
    await client.query(sql);
    console.log('数据库初始化完成');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('初始化数据库失败：', error);
  process.exit(1);
});

