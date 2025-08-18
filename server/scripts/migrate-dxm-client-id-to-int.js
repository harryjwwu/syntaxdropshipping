const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateDxmClientIdToInt() {
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

    // 1. 首先检查表是否存在
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
      [process.env.DB_NAME || 'syntaxdropshipping', 'spu_prices']
    );

    if (tables.length === 0) {
      console.log('❌ spu_prices表不存在');
      return;
    }

    // 2. 检查dxm_client_id字段是否存在
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [process.env.DB_NAME || 'syntaxdropshipping', 'spu_prices', 'dxm_client_id']
    );

    if (columns.length === 0) {
      console.log('❌ dxm_client_id字段不存在');
      return;
    }

    console.log(`📋 当前dxm_client_id字段类型: ${columns[0].DATA_TYPE}`);

    // 3. 检查是否有非数字值
    const [invalidData] = await connection.execute(
      `SELECT spu, dxm_client_id FROM spu_prices WHERE dxm_client_id NOT REGEXP '^[0-9]+$' LIMIT 5`
    );

    if (invalidData.length > 0) {
      console.log('❌ 发现非数字值，无法转换为INT类型:');
      invalidData.forEach(row => {
        console.log(`  SPU: ${row.spu}, dxm_client_id: ${row.dxm_client_id}`);
      });
      return;
    }

    console.log('✅ 所有dxm_client_id值都是数字，可以安全转换');

    // 4. 检查是否已经是INT类型
    if (columns[0].DATA_TYPE === 'int') {
      console.log('✅ dxm_client_id字段已经是INT类型，无需修改');
      return;
    }

    // 5. 开始迁移过程
    console.log('🚀 开始迁移过程...');

    // 删除相关索引和约束
    console.log('📝 删除现有索引和约束...');
    
    try {
      await connection.execute('ALTER TABLE spu_prices DROP INDEX uk_spu_client_country_qty');
      console.log('  ✅ 删除uk_spu_client_country_qty');
    } catch (error) {
      console.log('  ⚠️ uk_spu_client_country_qty索引可能不存在');
    }

    try {
      await connection.execute('ALTER TABLE spu_prices DROP INDEX idx_dxm_client_id');
      console.log('  ✅ 删除idx_dxm_client_id');
    } catch (error) {
      console.log('  ⚠️ idx_dxm_client_id索引可能不存在');
    }

    try {
      await connection.execute('ALTER TABLE spu_prices DROP INDEX idx_spu_client');
      console.log('  ✅ 删除idx_spu_client');
    } catch (error) {
      console.log('  ⚠️ idx_spu_client索引可能不存在');
    }

    try {
      await connection.execute('ALTER TABLE spu_prices DROP INDEX idx_client_country');
      console.log('  ✅ 删除idx_client_country');
    } catch (error) {
      console.log('  ⚠️ idx_client_country索引可能不存在');
    }

    // 修改字段类型
    console.log('📝 修改字段类型为INT...');
    await connection.execute(
      `ALTER TABLE spu_prices MODIFY COLUMN dxm_client_id INT NOT NULL COMMENT '店小秘客户ID'`
    );
    console.log('  ✅ 字段类型修改成功');

    // 重新创建索引和约束
    console.log('📝 重新创建索引和约束...');
    
    await connection.execute(
      'ALTER TABLE spu_prices ADD UNIQUE KEY uk_spu_client_country_qty (spu, dxm_client_id, country_code, quantity)'
    );
    console.log('  ✅ 创建uk_spu_client_country_qty');

    await connection.execute(
      'ALTER TABLE spu_prices ADD INDEX idx_dxm_client_id (dxm_client_id)'
    );
    console.log('  ✅ 创建idx_dxm_client_id');

    await connection.execute(
      'ALTER TABLE spu_prices ADD INDEX idx_spu_client (spu, dxm_client_id)'
    );
    console.log('  ✅ 创建idx_spu_client');

    await connection.execute(
      'ALTER TABLE spu_prices ADD INDEX idx_client_country (dxm_client_id, country_code)'
    );
    console.log('  ✅ 创建idx_client_country');

    // 验证修改结果
    const [newColumns] = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT 
       FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [process.env.DB_NAME || 'syntaxdropshipping', 'spu_prices', 'dxm_client_id']
    );

    console.log('✅ 迁移完成！字段信息:');
    console.log(`  字段名: ${newColumns[0].COLUMN_NAME}`);
    console.log(`  数据类型: ${newColumns[0].DATA_TYPE}`);
    console.log(`  允许NULL: ${newColumns[0].IS_NULLABLE}`);
    console.log(`  默认值: ${newColumns[0].COLUMN_DEFAULT}`);
    console.log(`  注释: ${newColumns[0].COLUMN_COMMENT}`);

    // 检查数据完整性
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM spu_prices');
    console.log(`📊 表中共有 ${count[0].total} 条记录`);

  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 执行迁移
if (require.main === module) {
  migrateDxmClientIdToInt()
    .then(() => {
      console.log('🎉 迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 迁移失败:', error);
      process.exit(1);
    });
}

module.exports = { migrateDxmClientIdToInt };
