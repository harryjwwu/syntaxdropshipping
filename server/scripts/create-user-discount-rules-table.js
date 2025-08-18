const mysql = require('mysql2/promise');
require('dotenv').config();

async function createUserDiscountRulesTable() {
  let connection;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'syntaxdropshipping',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ 数据库连接成功');

    // 检查表是否已存在
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
      [process.env.DB_NAME || 'syntaxdropshipping', 'user_discount_rules']
    );

    if (tables.length > 0) {
      console.log('⚠️ user_discount_rules表已存在，跳过创建');
      return;
    }

    console.log('🚀 开始创建user_discount_rules表...');

    // 创建用户折扣规则表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_discount_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dxm_client_id INT NOT NULL COMMENT '店小秘客户ID',
        min_quantity INT NOT NULL COMMENT '最小数量',
        max_quantity INT NOT NULL COMMENT '最大数量', 
        discount_rate DECIMAL(3,2) NOT NULL COMMENT '折扣率(0.85表示8.5折)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_dxm_client_id (dxm_client_id),
        INDEX idx_quantity_range (min_quantity, max_quantity),
        UNIQUE KEY uk_client_quantity_range (dxm_client_id, min_quantity, max_quantity)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户折扣规则表'
    `;

    await connection.execute(createTableSQL);
    console.log('✅ user_discount_rules表创建成功');

    // 验证表结构
    const [columns] = await connection.execute(`DESCRIBE user_discount_rules`);
    console.log('📋 表结构验证:');
    columns.forEach(column => {
      console.log(`  ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Key ? `[${column.Key}]` : ''}`);
    });

    // 检查索引
    const [indexes] = await connection.execute(`SHOW INDEX FROM user_discount_rules`);
    console.log('🔍 索引信息:');
    indexes.forEach(index => {
      console.log(`  ${index.Key_name}: ${index.Column_name} (${index.Non_unique === 0 ? 'UNIQUE' : 'INDEX'})`);
    });

    console.log('🎉 用户折扣规则表创建完成');

  } catch (error) {
    console.error('❌ 创建表过程中发生错误:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 执行创建
if (require.main === module) {
  createUserDiscountRulesTable()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { createUserDiscountRulesTable };
