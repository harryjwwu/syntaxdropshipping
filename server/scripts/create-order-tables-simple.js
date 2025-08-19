const { getConnection } = require('../config/database');

async function createOrderTables() {
  let connection;
  
  try {
    console.log('🔧 开始创建订单表...');
    
    connection = await getConnection();
    console.log('✅ 数据库连接成功');
    
    // 1. 创建分表配置表
    console.log('📊 创建分表配置表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`order_sharding_config\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`table_count\` int NOT NULL DEFAULT 10 COMMENT '分表数量',
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单分表配置'
    `);
    
    // 2. 插入默认配置
    await connection.execute(`
      INSERT IGNORE INTO \`order_sharding_config\` (\`id\`, \`table_count\`) VALUES (1, 10)
    `);
    
    console.log('✅ 分表配置表创建完成');
    
    // 3. 创建10个订单分表
    const tableCount = 10;
    
    for (let i = 0; i < tableCount; i++) {
      const tableName = `orders_${i}`;
      console.log(`📋 创建表: ${tableName}...`);
      
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`${tableName}\` (
          \`id\` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
          \`dxm_order_id\` varchar(50) NOT NULL COMMENT 'DXM订单号，如：7268217-3290',
          \`dxm_client_id\` int NOT NULL COMMENT 'DXM客户ID，从订单号拆分',
          \`order_id\` int NOT NULL COMMENT '真实订单ID，从订单号拆分',
          \`country_code\` varchar(5) DEFAULT NULL COMMENT '国家二字码',
          \`product_count\` int DEFAULT 1 COMMENT '商品数量',
          \`buyer_name\` varchar(100) DEFAULT NULL COMMENT '买家姓名',
          \`product_name\` text COMMENT '产品名称',
          \`payment_time\` datetime DEFAULT NULL COMMENT '付款时间',
          \`waybill_number\` varchar(50) DEFAULT NULL COMMENT '运单号',
          \`product_sku\` varchar(50) DEFAULT NULL COMMENT '商品SKU',
          \`product_spu\` varchar(50) DEFAULT NULL COMMENT '商品SPU',
          \`product_parent_spu\` varchar(50) DEFAULT NULL COMMENT '替换SPU',
          \`unit_price\` decimal(10,2) DEFAULT 0.00 COMMENT '单价（美元）',
          \`multi_total_price\` decimal(10,2) DEFAULT 0.00 COMMENT '总价（美元）',
          \`discount\` decimal(5,2) DEFAULT 0.00 COMMENT '折扣',
          \`settlement_amount\` decimal(10,2) DEFAULT 0.00 COMMENT '结算金额',
          \`remark\` json DEFAULT NULL COMMENT '备注信息：{customer_remark, picking_remark, order_remark}',
          \`order_status\` varchar(50) DEFAULT NULL COMMENT '订单状态',
          \`settlement_status\` enum('waiting','cancel','settled') DEFAULT 'waiting' COMMENT '结算状态',
          \`settle_remark\` text COMMENT '结算算法说明',
          \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uk_dxm_order_product\` (\`dxm_order_id\`, \`product_sku\`, \`product_name\`(100)) COMMENT '订单+商品唯一约束',
          KEY \`idx_dxm_client_id\` (\`dxm_client_id\`) COMMENT 'DXM客户ID索引',
          KEY \`idx_order_id\` (\`order_id\`) COMMENT '订单ID索引',
          KEY \`idx_payment_time\` (\`payment_time\`) COMMENT '付款时间索引',
          KEY \`idx_order_status\` (\`order_status\`) COMMENT '订单状态索引',
          KEY \`idx_settlement_status\` (\`settlement_status\`) COMMENT '结算状态索引',
          KEY \`idx_waybill_number\` (\`waybill_number\`) COMMENT '运单号索引',
          KEY \`idx_created_at\` (\`created_at\`) COMMENT '创建时间索引'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表_${i}'
      `);
      
      console.log(`✅ 表 ${tableName} 创建完成`);
    }
    
    // 4. 验证创建结果
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
    
    console.log('🎉 订单表创建完成!');
    
  } catch (error) {
    console.error('❌ 创建订单表失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createOrderTables()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = createOrderTables;


