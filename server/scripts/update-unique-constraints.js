const { getConnection } = require('../config/database');

async function updateUniqueConstraints() {
  let connection;
  
  try {
    console.log('🔧 开始更新订单表唯一约束...');
    
    connection = await getConnection();
    console.log('✅ 数据库连接成功');
    
    const tableCount = 10;
    
    for (let i = 0; i < tableCount; i++) {
      const tableName = `orders_${i}`;
      console.log(`📋 处理表: ${tableName}...`);
      
      try {
        // 1. 删除重复数据
        console.log(`  🧹 清理重复数据...`);
        await connection.execute(`
          DELETE t1 FROM \`${tableName}\` t1 
          INNER JOIN \`${tableName}\` t2 
          WHERE t1.id > t2.id 
          AND t1.dxm_order_id = t2.dxm_order_id 
          AND COALESCE(t1.product_sku, '') = COALESCE(t2.product_sku, '')
        `);
        
        // 2. 删除旧的唯一约束
        try {
          await connection.execute(`ALTER TABLE \`${tableName}\` DROP INDEX uk_dxm_order_product`);
          console.log(`  ✅ 删除旧约束 uk_dxm_order_product`);
        } catch (error) {
          console.log(`  ⚠️ 旧约束可能不存在: ${error.message}`);
        }
        
        // 3. 创建新的唯一约束
        await connection.execute(`
          ALTER TABLE \`${tableName}\` 
          ADD UNIQUE KEY uk_dxm_order_sku (dxm_order_id, product_sku)
        `);
        console.log(`  ✅ 创建新约束 uk_dxm_order_sku`);
        
        console.log(`✅ 表 ${tableName} 处理完成`);
        
      } catch (error) {
        console.error(`❌ 处理表 ${tableName} 失败:`, error.message);
        // 继续处理下一个表
      }
    }
    
    // 4. 处理异常订单表
    console.log(`📋 处理异常订单表...`);
    try {
      // 删除重复数据
      await connection.execute(`
        DELETE t1 FROM \`order_abnormal\` t1 
        INNER JOIN \`order_abnormal\` t2 
        WHERE t1.id > t2.id 
        AND t1.dxm_order_id = t2.dxm_order_id 
        AND COALESCE(t1.product_sku, '') = COALESCE(t2.product_sku, '')
      `);
      
      // 删除旧约束
      try {
        await connection.execute(`ALTER TABLE \`order_abnormal\` DROP INDEX uk_abnormal_order_product`);
        console.log(`  ✅ 删除旧约束 uk_abnormal_order_product`);
      } catch (error) {
        console.log(`  ⚠️ 旧约束可能不存在: ${error.message}`);
      }
      
      // 创建新约束
      await connection.execute(`
        ALTER TABLE \`order_abnormal\` 
        ADD UNIQUE KEY uk_abnormal_order_sku (dxm_order_id, product_sku)
      `);
      console.log(`  ✅ 创建新约束 uk_abnormal_order_sku`);
      
      console.log(`✅ 异常订单表处理完成`);
      
    } catch (error) {
      console.error(`❌ 处理异常订单表失败:`, error.message);
    }
    
    console.log('🎉 所有表的唯一约束更新完成！');
    
  } catch (error) {
    console.error('❌ 更新唯一约束失败:', error);
  } finally {
    if (connection) {
      connection.end();
    }
  }
}

// 运行脚本
updateUniqueConstraints();
