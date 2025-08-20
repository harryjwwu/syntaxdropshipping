#!/usr/bin/env node

/**
 * 测试新导入数据的结算功能
 * 使用2025-08-17的订单数据进行测试
 */

require('dotenv').config();
const SettlementManager = require('../utils/settlementManager');

async function testNewSettlement() {
  console.log('🧪 开始测试新导入数据的结算功能...\n');

  const settlementManager = new SettlementManager();
  const testDate = '2025-08-17'; // 选择有520条订单的日期

  try {
    console.log(`📅 测试日期: ${testDate}`);
    console.log('🚀 开始执行结算...\n');

    const startTime = Date.now();
    const stats = await settlementManager.settleOrdersByDate(testDate);
    const endTime = Date.now();

    console.log('\n✅ 结算完成！');
    console.log('📊 结算统计:');
    console.log(`   - 处理时间: ${endTime - startTime}ms`);
    console.log(`   - 处理订单: ${stats.processedOrders}`);
    console.log(`   - 成功结算: ${stats.settledOrders}`);
    console.log(`   - 用户折扣: ${stats.userDiscounts}`);
    console.log(`   - SPU价格: ${stats.spuPrices}`);
    console.log(`   - 跳过订单: ${stats.skippedOrders}`);
    console.log(`   - 错误数量: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n⚠️  错误详情:');
      stats.errors.slice(0, 5).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      if (stats.errors.length > 5) {
        console.log(`   ... 还有 ${stats.errors.length - 5} 个错误`);
      }
    }

    // 获取结算后的统计信息
    console.log('\n📈 获取结算后统计信息...');
    const finalStats = await settlementManager.getSettlementStats(testDate);
    console.log('📊 最终统计:');
    console.log(`   - 总订单数: ${finalStats.totalOrders}`);
    console.log(`   - 已计算: ${finalStats.calculatedOrders}`);
    console.log(`   - 已结算: ${finalStats.settledOrders}`);
    console.log(`   - 等待中: ${finalStats.waitingOrders}`);
    console.log(`   - 已取消: ${finalStats.cancelledOrders}`);
    console.log(`   - 总结算金额: $${finalStats.totalSettlementAmount.toFixed(2)}`);

    // 计算结算成功率
    const successRate = finalStats.totalOrders > 0 ? 
      (finalStats.calculatedOrders / finalStats.totalOrders * 100).toFixed(2) : 0;
    console.log(`   - 计算成功率: ${successRate}%`);

    console.log('\n🎉 结算功能测试完成！');
    
    return stats;

  } catch (error) {
    console.error('❌ 结算测试失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testNewSettlement()
    .then(() => {
      console.log('\n✨ 测试脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 测试脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { testNewSettlement };
