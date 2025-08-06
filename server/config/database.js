const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'syntaxdropshipping',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  timezone: '+08:00',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
};

// Create connection pool
let pool = null;

async function createPool() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log('✅ MySQL connection pool created successfully');
    return pool;
  } catch (error) {
    console.error('❌ Error creating MySQL connection pool:', error);
    throw error;
  }
}

// Get database connection
async function getConnection() {
  if (!pool) {
    await createPool();
  }
  return pool;
}

// Test database connection
async function testConnection() {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

// Close connection pool
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Database connection pool closed');
  }
}

module.exports = {
  getConnection,
  testConnection,
  closePool,
  createPool
};