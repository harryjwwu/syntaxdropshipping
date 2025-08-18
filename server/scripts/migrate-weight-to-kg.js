const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateWeightToKg() {
  let connection;
  
  try {
    console.log('🔧 开始迁移weight字段从INT(克)到DECIMAL(KG)...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'syntaxdropshipping',
      charset: 'utf8mb4'
    });

    console.log('✅ 数据库连接成功');

    // 1. 首先备份现有数据
    console.log('📋 查询现有SPU数据...');
    const [existingSpus] = await connection.execute(
      'SELECT spu, name, weight FROM spus WHERE weight IS NOT NULL'
    );
    
    console.log(`📊 找到 ${existingSpus.length} 个有重量数据的SPU`);
    
    if (existingSpus.length > 0) {
      console.log('📋 现有重量数据预览:');
      existingSpus.slice(0, 5).forEach(spu => {
        console.log(`  - ${spu.spu}: ${spu.name} = ${spu.weight}g`);
      });
    }

    // 2. 修改字段类型
    console.log('🔧 修改weight字段类型为DECIMAL(10,3)...');
    await connection.execute(`
      ALTER TABLE spus 
      MODIFY COLUMN weight DECIMAL(10,3) COMMENT '重量(KG)'
    `);
    
    console.log('✅ 字段类型修改成功');

    // 3. 转换现有数据：从克转换为千克
    if (existingSpus.length > 0) {
      console.log('🔄 转换现有数据从克到千克...');
      
      for (const spu of existingSpus) {
        if (spu.weight && spu.weight > 0) {
          const weightInKg = parseFloat(spu.weight) / 1000;
          
          await connection.execute(
            'UPDATE spus SET weight = ? WHERE spu = ?',
            [weightInKg, spu.spu]
          );
          
          console.log(`  ✓ ${spu.spu}: ${spu.weight}g → ${weightInKg}kg`);
        }
      }
    }

    // 4. 验证迁移结果
    console.log('🧪 验证迁移结果...');
    const [updatedSpus] = await connection.execute(
      'SELECT spu, name, weight FROM spus WHERE weight IS NOT NULL LIMIT 5'
    );
    
    console.log('📋 迁移后数据预览:');
    updatedSpus.forEach(spu => {
      console.log(`  - ${spu.spu}: ${spu.name} = ${spu.weight}kg`);
    });

    console.log('🎉 weight字段迁移完成！');
    console.log('📝 迁移总结:');
    console.log(`  - 字段类型: INT → DECIMAL(10,3)`);
    console.log(`  - 单位: 克(g) → 千克(kg)`);
    console.log(`  - 迁移记录数: ${existingSpus.length}`);

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 运行迁移
if (require.main === module) {
  migrateWeightToKg()
    .then(() => {
      console.log('✅ 迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 迁移脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = migrateWeightToKg;
