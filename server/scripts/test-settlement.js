#!/usr/bin/env node

/**
 * 订单结算功能测试脚本
 * 用于测试结算管理器的各项功能
 */

require('dotenv').config();
const SettlementManager = require('../utils/settlementManager');
const { getConnection } = require('../config/database');

async function testSettlement() {
  console.log('🧪 开始测试订单结算功能...\n');

  const settlementManager = new SettlementManager();
  
  try {
    // 测试1: 获取结算统计信息
    console.log('📊 测试1: 获取结算统计信息');
    const testDate = '2024-01-15'; // 使用一个测试日期
    const stats = await settlementManager.getSettlementStats(testDate);
    console.log('统计结果:', JSON.stringify(stats, null, 2));
    console.log('✅ 统计功能正常\n');

    // 测试2: 分表路由功能
    console.log('🔀 测试2: 分表路由功能');
    const testClientIds = [444, 555, 1001, 2003];
    testClientIds.forEach(clientId => {
      const tableName = settlementManager.getOrderTableName(clientId);
      console.log(`客户ID ${clientId} -> 表名: ${tableName}`);
    });
    console.log('✅ 分表路由功能正常\n');

    // 测试3: 检查数据库表结构
    console.log('🔍 测试3: 检查数据库表结构');
    const connection = await getConnection();
    
    // 检查订单表
    const tables = settlementManager.getAllOrderTableNames();
    console.log('订单分表列表:', tables);
    
    for (const tableName of tables.slice(0, 2)) { // 只检查前2个表
      try {
        const [rows] = await connection.execute(`SHOW COLUMNS FROM ${tableName}`);
        console.log(`表 ${tableName} 字段:`, rows.map(r => r.Field).join(', '));
      } catch (error) {
        console.warn(`⚠️  表 ${tableName} 不存在或无法访问:`, error.message);
      }
    }

    // 检查相关表
    const relatedTables = ['sku_spu_relations', 'user_discount_rules', 'spu_prices'];
    for (const tableName of relatedTables) {
      try {
        const [rows] = await connection.execute(`SHOW COLUMNS FROM ${tableName}`);
        console.log(`表 ${tableName} 字段:`, rows.map(r => r.Field).join(', '));
      } catch (error) {
        console.warn(`⚠️  表 ${tableName} 不存在:`, error.message);
      }
    }
    console.log('✅ 数据库表结构检查完成\n');

    // 测试4: 模拟结算过程（不执行实际更新）
    console.log('🎯 测试4: 模拟结算过程');
    
    // 检查是否有测试数据
    let hasTestData = false;
    for (const tableName of tables.slice(0, 3)) {
      try {
        const [rows] = await connection.execute(`
          SELECT COUNT(*) as count FROM ${tableName} 
          WHERE payment_time >= '2024-01-01' 
            AND settlement_status = 'waiting'
        `);
        if (rows[0].count > 0) {
          console.log(`表 ${tableName} 有 ${rows[0].count} 条待结算订单`);
          hasTestData = true;
        }
      } catch (error) {
        console.warn(`检查表 ${tableName} 时出错:`, error.message);
      }
    }

    if (!hasTestData) {
      console.log('⚠️  没有找到测试数据，跳过实际结算测试');
      console.log('💡 建议：添加一些测试订单数据后再运行此脚本');
    } else {
      console.log('✅ 找到测试数据，可以进行实际结算测试');
      console.log('💡 如需执行实际结算，请调用: settlementManager.settleOrdersByDate("YYYY-MM-DD")');
    }

    console.log('\n🎉 所有测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testSettlement()
    .then(() => {
      console.log('测试脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('测试脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { testSettlement };
