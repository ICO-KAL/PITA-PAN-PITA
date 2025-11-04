const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function importSql() {
  const sqlPath = path.resolve(__dirname, '../../db/PintaPunPita.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL file not found at', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || undefined,
    multipleStatements: true
  });

  try {
    console.log('Importing SQL from', sqlPath);
    await connection.query(sql);
    console.log('SQL import completed.');
  } catch (err) {
    console.error('Import failed:', err.message);
  } finally {
    await connection.end();
  }
}

importSql().catch(err => {
  console.error(err);
  process.exit(1);
});
