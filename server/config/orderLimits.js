/**
 * 订单批量处理限制配置
 */

const ORDER_LIMITS = {
  // 批量处理限制
  BATCH_SIZE: 5000,              // 每批次最多处理的订单数量
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 最大文件大小: 50MB
  MAX_TOTAL_ORDERS: 100000,      // 单次导入最大订单数量
  
  // 数据库相关限制
  MAX_SQL_PACKET: 64 * 1024 * 1024, // MySQL max_allowed_packet: 64MB
  CONNECTION_TIMEOUT: 300000,    // 连接超时: 5分钟
  
  // 内存使用限制
  MAX_MEMORY_USAGE: 512 * 1024 * 1024, // 最大内存使用: 512MB
  
  // 性能相关配置
  PROGRESS_UPDATE_INTERVAL: 100, // 每处理多少条更新一次进度
  CONCURRENT_TABLES: 10,         // 并发处理的表数量
  
  // 验证相关限制
  MAX_ERROR_DISPLAY: 50,         // 最多显示的错误数量
  MAX_SAMPLE_DISPLAY: 10,        // 最多显示的样例数量
};

/**
 * 根据数据量动态调整批次大小
 * @param {number} totalOrders - 总订单数量
 * @returns {number} 建议的批次大小
 */
function getOptimalBatchSize(totalOrders) {
  if (totalOrders <= 1000) {
    return totalOrders; // 小数据量直接处理
  } else if (totalOrders <= 10000) {
    return 2000; // 中等数据量
  } else if (totalOrders <= 50000) {
    return 5000; // 大数据量
  } else {
    return 3000; // 超大数据量，减小批次避免超时
  }
}

/**
 * 估算内存使用量
 * @param {number} orderCount - 订单数量
 * @returns {number} 估算的内存使用量（字节）
 */
function estimateMemoryUsage(orderCount) {
  const AVG_ORDER_SIZE = 500; // 每条订单平均500字节
  return orderCount * AVG_ORDER_SIZE;
}

/**
 * 检查是否超出处理限制
 * @param {number} orderCount - 订单数量
 * @param {number} fileSize - 文件大小
 * @returns {object} 检查结果
 */
function checkLimits(orderCount, fileSize) {
  const errors = [];
  const warnings = [];
  
  // 检查文件大小
  if (fileSize > ORDER_LIMITS.MAX_FILE_SIZE) {
    errors.push(`文件大小${(fileSize/1024/1024).toFixed(1)}MB超过限制${ORDER_LIMITS.MAX_FILE_SIZE/1024/1024}MB`);
  }
  
  // 检查订单数量
  if (orderCount > ORDER_LIMITS.MAX_TOTAL_ORDERS) {
    errors.push(`订单数量${orderCount}超过单次导入限制${ORDER_LIMITS.MAX_TOTAL_ORDERS}`);
  }
  
  // 检查内存使用
  const memoryUsage = estimateMemoryUsage(orderCount);
  if (memoryUsage > ORDER_LIMITS.MAX_MEMORY_USAGE) {
    warnings.push(`预计内存使用${(memoryUsage/1024/1024).toFixed(1)}MB，可能影响性能`);
  }
  
  // 性能警告
  if (orderCount > 50000) {
    warnings.push('大数据量导入，预计处理时间较长，请耐心等待');
  }
  
  return {
    canProcess: errors.length === 0,
    errors,
    warnings,
    recommendedBatchSize: getOptimalBatchSize(orderCount),
    estimatedTime: Math.ceil(orderCount / 2000), // 估算处理时间（秒）
    estimatedMemory: memoryUsage
  };
}

module.exports = {
  ORDER_LIMITS,
  getOptimalBatchSize,
  estimateMemoryUsage,
  checkLimits
};
