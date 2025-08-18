const fs = require('fs').promises;
const path = require('path');
const { getConnection } = require('../config/database');

/**
 * 初始化SPU相关数据库表
 */
async function initSPUTables() {
  console.log('🚀 开始初始化SPU相关数据库表...');
  
  try {
    const pool = await getConnection();
    
    // 读取SQL文件
    const spuSqlFile = path.join(__dirname, '../config/spu-schema.sql');
    const historySqlFile = path.join(__dirname, '../config/price-history-schema.sql');
    
    const spuSqlContent = await fs.readFile(spuSqlFile, 'utf8');
    const historySqlContent = await fs.readFile(historySqlFile, 'utf8');
    
    const sqlContent = spuSqlContent + '\n\n' + historySqlContent;
    
    // 清理注释和空行，然后分割SQL语句
    const cleanedContent = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim())
      .join('\n');
    
    // 分割SQL语句（以分号分割）
    const statements = cleanedContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && stmt.length > 10);
    
    console.log(`📝 找到 ${statements.length} 条SQL语句`);
    
    // 执行每条SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          await pool.execute(statement);
          console.log(`✅ 执行成功 (${i + 1}/${statements.length})`);
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`⚠️  表已存在，跳过 (${i + 1}/${statements.length})`);
          } else {
            console.error(`❌ 执行失败 (${i + 1}/${statements.length}):`, error.message);
            throw error;
          }
        }
      }
    }
    
    console.log('🎉 SPU相关数据库表初始化完成！');
    console.log('');
    console.log('📊 已创建的表:');
    console.log('  - spus (SPU商品表)');
    console.log('  - sku_spu_relations (SKU-SPU关系表)');
    console.log('  - spu_prices (SPU价格表)');
    console.log('  - countries (国家代码表)');
    console.log('  - spu_price_history (SPU价格变更历史表)');
    console.log('');
    
  } catch (error) {
    console.error('❌ SPU数据库表初始化失败:', error);
    throw error;
  }
}

/**
 * 检查SPU表是否存在
 */
async function checkSPUTables() {
  try {
    const pool = await getConnection();
    
    const tables = ['spus', 'sku_spu_relations', 'spu_prices', 'countries'];
    const results = {};
    
    for (const table of tables) {
      try {
        const [rows] = await pool.execute(`SHOW TABLES LIKE '${table}'`);
        results[table] = rows.length > 0;
      } catch (error) {
        results[table] = false;
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ 检查SPU表失败:', error);
    return {};
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initSPUTables()
    .then(() => {
      console.log('✅ 初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 初始化失败:', error);
      process.exit(1);
    });
}

module.exports = {
  initSPUTables,
  checkSPUTables
};
