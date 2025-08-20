#!/usr/bin/env node

/**
 * 根据orders_7表的数据，补全结算功能依赖的其他表数据
 * 包括：spus, sku_spu_relations, spu_prices, user_discount_rules
 */

require('dotenv').config();
const { getConnection } = require('../config/database');

async function populateSettlementTestData() {
  console.log('🚀 开始补全结算功能测试数据...\n');

  const pool = await getConnection();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. 获取orders_7表的基础数据
    console.log('📊 1. 分析orders_7表的数据...');
    const [orderData] = await connection.execute(`
      SELECT DISTINCT 
        dxm_client_id, 
        product_sku, 
        country_code, 
        product_count,
        buyer_name
      FROM orders_7 
      WHERE product_sku IS NOT NULL 
        AND product_sku != ''
        AND product_sku != 'Upsell'
      ORDER BY dxm_client_id, product_sku
    `);

    console.log(`   找到 ${orderData.length} 条不重复的订单数据`);

    // 2. 创建SPU数据和SKU-SPU关系
    console.log('\n📦 2. 创建SPU数据和SKU-SPU关系...');
    const spuMap = new Map();
    const skuSpuRelations = [];

    orderData.forEach(order => {
      const sku = order.product_sku;
      
      // 从SKU中提取SPU（去掉尺码、颜色等后缀）
      let spu = sku;
      
      // 处理各种SKU格式，提取基础SPU
      if (sku.includes('-')) {
        const parts = sku.split('-');
        if (parts.length >= 2) {
          // 对于像 K-11033-M-BK 这样的格式，取前两部分作为SPU
          if (sku.startsWith('K-') || sku.startsWith('T-') || sku.startsWith('O-') || sku.startsWith('X-') || sku.startsWith('H-')) {
            spu = `${parts[0]}-${parts[1]}`;
          } else if (parts[0].match(/^\d+$/)) {
            // 对于像 10176-1BK 这样的格式，取第一部分作为SPU
            spu = parts[0];
          } else {
            spu = `${parts[0]}-${parts[1]}`;
          }
        }
      }

      // 创建SPU记录
      if (!spuMap.has(spu)) {
        spuMap.set(spu, {
          spu: spu,
          name: `商品 ${spu}`,
          photo: null,
          logistics_methods: 'Standard',
          weight: (Math.random() * 2 + 0.1).toFixed(3), // 随机重量 0.1-2.1kg
          parent_spu: null
        });
      }

      // 创建SKU-SPU关系
      skuSpuRelations.push({
        sku: sku,
        spu: spu
      });
    });

    // 插入SPU数据
    console.log(`   创建 ${spuMap.size} 个SPU记录...`);
    for (const spuData of spuMap.values()) {
      await connection.execute(`
        INSERT IGNORE INTO spus (spu, name, photo, logistics_methods, weight, parent_spu)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [spuData.spu, spuData.name, spuData.photo, spuData.logistics_methods, spuData.weight, spuData.parent_spu]);
    }

    // 插入SKU-SPU关系
    console.log(`   创建 ${skuSpuRelations.length} 个SKU-SPU关系...`);
    for (const relation of skuSpuRelations) {
      await connection.execute(`
        INSERT IGNORE INTO sku_spu_relations (sku, spu)
        VALUES (?, ?)
      `, [relation.sku, relation.spu]);
    }

    // 3. 创建用户折扣规则
    console.log('\n💰 3. 创建用户折扣规则...');
    const clientIds = [...new Set(orderData.map(order => order.dxm_client_id))];
    console.log(`   为 ${clientIds.length} 个客户创建折扣规则...`);

    for (const clientId of clientIds) {
      // 为每个客户创建阶梯折扣规则
      const discountRules = [
        { min: 1, max: 3, rate: 0.95 },   // 1-3件：95折
        { min: 4, max: 8, rate: 0.90 },   // 4-8件：9折
        { min: 9, max: 15, rate: 0.85 },  // 9-15件：8.5折
        { min: 16, max: 999, rate: 0.80 } // 16件以上：8折
      ];

      for (const rule of discountRules) {
        await connection.execute(`
          INSERT IGNORE INTO user_discount_rules 
          (dxm_client_id, min_quantity, max_quantity, discount_rate)
          VALUES (?, ?, ?, ?)
        `, [clientId, rule.min, rule.max, rule.rate]);
      }
    }

    // 4. 创建客户专属SPU价格
    console.log('\n💵 4. 创建客户专属SPU价格...');
    let priceCount = 0;

    // 按客户、SPU、国家、数量组合创建价格
    const priceGroups = new Map();
    
    orderData.forEach(order => {
      const sku = order.product_sku;
      let spu = sku;
      
      // 提取SPU（与上面逻辑相同）
      if (sku.includes('-')) {
        const parts = sku.split('-');
        if (parts.length >= 2) {
          if (sku.startsWith('K-') || sku.startsWith('T-') || sku.startsWith('O-') || sku.startsWith('X-') || sku.startsWith('H-')) {
            spu = `${parts[0]}-${parts[1]}`;
          } else if (parts[0].match(/^\d+$/)) {
            spu = parts[0];
          } else {
            spu = `${parts[0]}-${parts[1]}`;
          }
        }
      }

      const key = `${order.dxm_client_id}_${spu}_${order.country_code}_${order.product_count}`;
      if (!priceGroups.has(key)) {
        priceGroups.set(key, {
          dxm_client_id: order.dxm_client_id,
          spu: spu,
          country_code: order.country_code,
          quantity: order.product_count
        });
      }
    });

    console.log(`   创建 ${priceGroups.size} 个价格记录...`);

    for (const priceData of priceGroups.values()) {
      // 生成合理的价格数据
      const basePrice = Math.random() * 20 + 10; // 基础价格 10-30美元
      const productCost = basePrice * 0.4; // 成本约40%
      const shippingCost = Math.random() * 5 + 2; // 运费 2-7美元
      const packingCost = Math.random() * 2 + 0.5; // 包装费 0.5-2.5美元
      const vatCost = basePrice * 0.1; // 税费约10%
      
      // 数量折扣：数量越多，单价越低
      const quantityDiscount = priceData.quantity > 1 ? 0.85 : 1.0;
      const totalPrice = (productCost + shippingCost + packingCost + vatCost) * priceData.quantity * quantityDiscount;

      await connection.execute(`
        INSERT IGNORE INTO spu_prices 
        (dxm_client_id, spu, country_code, product_cost, shipping_cost, packing_cost, vat_cost, quantity, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        priceData.dxm_client_id,
        priceData.spu,
        priceData.country_code,
        productCost.toFixed(2),
        shippingCost.toFixed(2),
        packingCost.toFixed(2),
        vatCost.toFixed(2),
        priceData.quantity,
        totalPrice.toFixed(2)
      ]);

      priceCount++;
    }

    await connection.commit();
    
    console.log('\n✅ 数据补全完成！');
    console.log('📊 统计信息:');
    console.log(`   - SPU记录: ${spuMap.size}`);
    console.log(`   - SKU-SPU关系: ${skuSpuRelations.length}`);
    console.log(`   - 客户数量: ${clientIds.length}`);
    console.log(`   - 折扣规则: ${clientIds.length * 4}`);
    console.log(`   - 价格记录: ${priceCount}`);

    // 5. 验证数据
    console.log('\n🔍 验证补全的数据...');
    
    const [spuCount] = await connection.execute('SELECT COUNT(*) as count FROM spus');
    console.log(`   SPU表记录数: ${spuCount[0].count}`);
    
    const [relationCount] = await connection.execute('SELECT COUNT(*) as count FROM sku_spu_relations');
    console.log(`   SKU-SPU关系表记录数: ${relationCount[0].count}`);
    
    const [discountCount] = await connection.execute('SELECT COUNT(*) as count FROM user_discount_rules');
    console.log(`   用户折扣规则表记录数: ${discountCount[0].count}`);
    
    const [pricesCount] = await connection.execute('SELECT COUNT(*) as count FROM spu_prices');
    console.log(`   SPU价格表记录数: ${pricesCount[0].count}`);

    console.log('\n🎉 所有测试数据已准备就绪，可以开始测试结算功能！');
    console.log('\n💡 测试建议:');
    console.log('   1. 运行测试脚本: node server/scripts/test-settlement.js');
    console.log('   2. 调用结算API: POST /api/admin/settlement/settle');
    console.log('   3. 检查结算结果: GET /api/admin/settlement/stats/YYYY-MM-DD');

  } catch (error) {
    await connection.rollback();
    console.error('❌ 数据补全失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  populateSettlementTestData()
    .then(() => {
      console.log('\n✨ 脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { populateSettlementTestData };
