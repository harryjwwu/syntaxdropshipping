const fs = require('fs');
const path = require('path');
const OrderExcelParser = require('../utils/orderExcelParser');
const orderShardingManager = require('../utils/orderShardingManager');

async function testOrderImport() {
  try {
    console.log('🧪 开始测试订单导入功能...');
    
    // 初始化分表管理器
    await orderShardingManager.init();
    
    // 读取Excel文件
    const excelPath = path.join(__dirname, '../resource/订单导出8.16-8.17.xlsx');
    console.log('📁 Excel文件路径:', excelPath);
    
    if (!fs.existsSync(excelPath)) {
      throw new Error('Excel文件不存在');
    }
    
    const buffer = fs.readFileSync(excelPath);
    console.log(`📋 文件大小: ${buffer.length} bytes`);
    
    // 解析Excel文件
    console.log('\n📊 开始解析Excel文件...');
    const parser = new OrderExcelParser();
    const parseResult = parser.parseExcel(buffer);
    
    if (!parseResult.success) {
      throw new Error(`解析失败: ${parseResult.error}`);
    }
    
    console.log(`✅ 解析成功:`);
    console.log(`  - 总行数: ${parseResult.total}`);
    console.log(`  - 成功解析: ${parseResult.parsed}`);
    console.log(`  - 解析失败: ${parseResult.failed}`);
    
    if (parseResult.failed > 0) {
      console.log('\n❌ 解析错误样例 (前5个):');
      parseResult.errors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. 第${error.row}行: ${error.error}`);
      });
    }
    
    // 显示解析的数据样例
    console.log('\n📋 解析数据样例 (前3条):');
    parseResult.orders.slice(0, 3).forEach((order, index) => {
      console.log(`\n  订单 ${index + 1}:`);
      console.log(`    订单号: ${order.dxm_order_id}`);
      console.log(`    国家: ${order.country_code}`);
      console.log(`    买家: ${order.buyer_name}`);
      console.log(`    产品: ${order.product_name?.substring(0, 50)}...`);
      console.log(`    付款时间: ${order.payment_time}`);
      console.log(`    运单号: ${order.waybill_number}`);
      console.log(`    SKU: ${order.product_sku}`);
      console.log(`    状态: ${order.order_status}`);
    });
    
    // 验证数据
    console.log('\n🔍 开始验证订单数据...');
    const validationResult = parser.validateOrders(parseResult.orders);
    console.log(`✅ 验证结果:`);
    console.log(`  - 有效订单: ${validationResult.validCount}`);
    console.log(`  - 无效订单: ${validationResult.invalidCount}`);
    
    if (validationResult.invalidCount > 0) {
      console.log('\n❌ 验证错误样例 (前3个):');
      validationResult.invalid.slice(0, 3).forEach((invalid, index) => {
        console.log(`  ${index + 1}. 订单${invalid.index + 1}: ${invalid.errors.join(', ')}`);
      });
    }
    
    if (validationResult.validCount === 0) {
      throw new Error('没有有效的订单数据');
    }
    
    // 测试少量数据插入（前10条）
    const testOrders = validationResult.valid.slice(0, 10);
    console.log(`\n💾 测试插入前${testOrders.length}条订单数据...`);
    
    const insertResult = await orderShardingManager.batchInsertOrders(testOrders);
    console.log(`✅ 插入结果:`);
    console.log(`  - 成功插入: ${insertResult.success}`);
    console.log(`  - 插入失败: ${insertResult.failed}`);
    
    if (insertResult.failed > 0) {
      console.log('\n❌ 插入错误:');
      insertResult.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.error}`);
      });
    }
    
    // 测试查询功能
    if (insertResult.success > 0) {
      console.log('\n🔍 测试查询功能...');
      
      // 获取第一个成功插入的订单的客户ID
      const firstOrder = testOrders[0];
      const { dxmClientId } = orderShardingManager.parseDxmOrderId(firstOrder.dxm_order_id);
      
      console.log(`📊 查询客户 ${dxmClientId} 的订单...`);
      const orders = await orderShardingManager.getOrdersByClientId(dxmClientId, { limit: 5 });
      console.log(`✅ 找到 ${orders.length} 条订单`);
      
      if (orders.length > 0) {
        console.log('📋 订单样例:');
        orders.slice(0, 2).forEach((order, index) => {
          console.log(`  ${index + 1}. ${order.dxm_order_id} - ${order.buyer_name} - ${order.order_status}`);
        });
      }
      
      // 测试统计功能
      console.log(`\n📈 获取客户 ${dxmClientId} 的统计信息...`);
      const stats = await orderShardingManager.getOrderStats(dxmClientId);
      console.log(`✅ 统计结果:`, stats);
    }
    
    console.log('\n🎉 订单导入测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testOrderImport()
    .then(() => {
      console.log('✅ 测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 测试失败:', error);
      process.exit(1);
    });
}

module.exports = testOrderImport;


