const { getConnection } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initOrderTables() {
  let connection;
  
  try {
    console.log('🔧 开始初始化订单表...');
    
    connection = await getConnection();
    console.log('✅ 数据库连接成功');
    
    // 读取SQL文件
    const sqlPath = path.join(__dirname, '../config/orders-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // 分割SQL语句（按分号分割，但要处理存储过程中的分号）
    const statements = [];
    let currentStatement = '';
    let inProcedure = false;
    
    const lines = sqlContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 检测存储过程开始
      if (trimmedLine.includes('DELIMITER $$') || trimmedLine.includes('CREATE PROCEDURE') || trimmedLine.includes('CREATE FUNCTION')) {
        inProcedure = true;
      }
      
      // 检测存储过程结束
      if (trimmedLine.includes('DELIMITER ;') && inProcedure) {
        inProcedure = false;
      }
      
      currentStatement += line + '\n';
      
      // 如果不在存储过程中，并且行以分号结尾，则认为是一个完整的语句
      if (!inProcedure && trimmedLine.endsWith(';') && !trimmedLine.startsWith('--')) {
        if (currentStatement.trim() && !currentStatement.trim().startsWith('--')) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
      }
    }
    
    // 添加最后一个语句
    if (currentStatement.trim() && !currentStatement.trim().startsWith('--')) {
      statements.push(currentStatement.trim());
    }
    
    console.log(`📝 准备执行 ${statements.length} 条SQL语句`);
    
    // 执行SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // 跳过空语句和注释
      if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }
      
      try {
        console.log(`📊 执行第 ${i + 1} 条语句...`);
        
        // 特殊处理DELIMITER语句
        if (statement.includes('DELIMITER')) {
          console.log('⏭️ 跳过DELIMITER语句');
          continue;
        }
        
        await connection.execute(statement);
        console.log(`✅ 第 ${i + 1} 条语句执行成功`);
        
      } catch (error) {
        console.error(`❌ 第 ${i + 1} 条语句执行失败:`, statement.substring(0, 100) + '...');
        console.error('错误详情:', error.message);
        
        // 对于某些非致命错误，继续执行
        if (error.message.includes('already exists') || 
            error.message.includes('Duplicate entry')) {
          console.log('⚠️ 表或数据已存在，继续执行...');
          continue;
        }
        
        throw error;
      }
    }
    
    // 验证表是否创建成功
    console.log('🔍 验证订单表创建结果...');
    
    const [tables] = await connection.execute("SHOW TABLES LIKE 'orders_%'");
    console.log(`✅ 成功创建 ${tables.length} 个订单分表:`);
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${Object.values(table)[0]}`);
    });
    
    // 检查配置表
    const [configRows] = await connection.execute('SELECT * FROM order_sharding_config WHERE id = 1');
    if (configRows.length > 0) {
      console.log(`📊 分表配置: ${configRows[0].table_count} 个表`);
    }
    
    console.log('🎉 订单表初始化完成!');
    
  } catch (error) {
    console.error('❌ 初始化订单表失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initOrderTables()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = initOrderTables;


