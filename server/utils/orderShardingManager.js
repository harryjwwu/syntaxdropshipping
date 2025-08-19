const { getConnection } = require('../config/database');
const { ORDER_LIMITS, getOptimalBatchSize, checkLimits } = require('../config/orderLimits');

/**
 * 订单分表管理器
 * 负责处理订单数据的分表路由和操作
 */
class OrderShardingManager {
  constructor() {
    this.tableCount = 10; // 默认分表数量
    this.tablePrefix = 'orders_';
  }

  /**
   * 初始化分表配置
   */
  async init() {
    try {
      const connection = await getConnection();
      const [rows] = await connection.execute(
        'SELECT table_count FROM order_sharding_config WHERE id = 1'
      );
      
      if (rows.length > 0) {
        this.tableCount = rows[0].table_count;
      }
      
      console.log(`📊 订单分表管理器初始化完成，分表数量: ${this.tableCount}`);
    } catch (error) {
      console.error('❌ 初始化订单分表配置失败:', error);
    }
  }

  /**
   * 根据客户ID获取分表名
   * @param {number} dxmClientId - DXM客户ID
   * @returns {string} 分表名
   */
  getTableName(dxmClientId) {
    const tableIndex = dxmClientId % this.tableCount;
    return `${this.tablePrefix}${tableIndex}`;
  }

  /**
   * 安全的JSON序列化，处理特殊字符
   * @param {any} data - 要序列化的数据
   * @returns {string} 安全的JSON字符串
   */
  safeJsonStringify(data) {
    try {
      if (!data) return null;
      
      // 如果已经是字符串，先尝试解析再重新序列化
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          // 如果不是有效JSON，包装成对象
          data = { value: data };
        }
      }
      
      // 清理对象中的特殊字符
      const cleanData = this.cleanObjectForJson(data);
      return JSON.stringify(cleanData);
      
    } catch (error) {
      console.warn('⚠️ JSON序列化失败，使用空值:', error.message);
      return null;
    }
  }

  /**
   * 清理对象中的特殊字符，确保JSON兼容
   * @param {any} obj - 要清理的对象
   * @returns {any} 清理后的对象
   */
  cleanObjectForJson(obj) {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (typeof obj === 'string') {
      // 移除可能导致JSON问题的特殊字符
      return obj.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
    }
    
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        cleaned[key] = this.cleanObjectForJson(value);
      }
      return cleaned;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObjectForJson(item));
    }
    
    return obj;
  }

  /**
   * 解析DXM订单号
   * @param {string} dxmOrderId - DXM订单号，格式：7268217-3290
   * @returns {object} {dxmClientId, orderId}
   */
  parseDxmOrderId(dxmOrderId) {
    if (!dxmOrderId || typeof dxmOrderId !== 'string') {
      throw new Error('无效的DXM订单号');
    }

    const parts = dxmOrderId.split('-');
    if (parts.length !== 2) {
      throw new Error(`DXM订单号格式错误: ${dxmOrderId}`);
    }

    const dxmClientId = parseInt(parts[0]);
    const orderId = parseInt(parts[1]);

    if (isNaN(dxmClientId) || isNaN(orderId)) {
      throw new Error(`DXM订单号包含非数字字符: ${dxmOrderId}`);
    }

    return { dxmClientId, orderId };
  }

  /**
   * 插入订单数据
   * @param {object} orderData - 订单数据
   * @returns {object} 插入结果
   */
  async insertOrder(orderData) {
    const connection = await getConnection();
    
    try {
      // 解析订单号
      const { dxmClientId, orderId } = this.parseDxmOrderId(orderData.dxm_order_id);
      
      // 获取分表名
      const tableName = this.getTableName(dxmClientId);
      
      // 准备数据，将undefined转换为null
      const insertData = {
        dxm_order_id: orderData.dxm_order_id || null,
        dxm_client_id: dxmClientId,
        order_id: orderId,
        country_code: orderData.country_code || null,
        product_count: orderData.product_count || 1,
        buyer_name: orderData.buyer_name || null,
        product_name: orderData.product_name || null,
        payment_time: orderData.payment_time || null,
        waybill_number: orderData.waybill_number || null,
        product_sku: orderData.product_sku || null,
        product_spu: orderData.product_spu || null,
        product_parent_spu: orderData.product_parent_spu || null,
        unit_price: orderData.unit_price || 0,
        multi_total_price: orderData.multi_total_price || 0,
        discount: orderData.discount || 0,
        settlement_amount: orderData.settlement_amount || 0,
        remark: orderData.remark ? this.safeJsonStringify(orderData.remark) : null,
        order_status: orderData.order_status || null,
        settlement_status: orderData.settlement_status || 'waiting',
        settle_remark: orderData.settle_remark || null
      };

      // 构建SQL
      const columns = Object.keys(insertData).join(', ');
      const placeholders = Object.keys(insertData).map(() => '?').join(', ');
      const values = Object.values(insertData);

      const sql = `INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`;
      
      const [result] = await connection.execute(sql, values);
      
      return {
        success: true,
        insertId: result.insertId,
        tableName: tableName,
        affectedRows: result.affectedRows
      };
      
    } catch (error) {
      console.error('❌ 插入订单数据失败:', error);
      throw error;
    }
  }

  /**
   * 批量插入订单数据（支持进度回调）
   * @param {Array} ordersData - 订单数据数组
   * @param {Function} progressCallback - 进度回调函数
   * @returns {object} 插入结果统计
   */
  async batchInsertOrders(ordersData, progressCallback = null) {
    const connection = await getConnection();
    const results = {
      success: 0,
      failed: 0,
      abnormal: 0,
      errors: []
    };

    const totalOrders = ordersData.length;
    let processedOrders = 0;

    // 按分表分组数据
    const tableGroups = {};
    const abnormalOrders = []; // 存储异常订单
    
    if (progressCallback) {
      progressCallback({
        step: '数据分组中...',
        progress: 0,
        processedItems: 0,
        totalItems: totalOrders
      });
    }
    
    for (let i = 0; i < ordersData.length; i++) {
      const orderData = ordersData[i];
      
      // 检查是否为验证失败的订单
      if (orderData._validationFailed) {
        // 验证失败的订单直接放入异常订单列表
        abnormalOrders.push({ 
          index: i, 
          data: orderData, 
          error: `验证失败: ${orderData._validationErrors.join(', ')}` 
        });
        continue;
      }
      
      try {
        const { dxmClientId } = this.parseDxmOrderId(orderData.dxm_order_id);
        const tableName = this.getTableName(dxmClientId);
        
        if (!tableGroups[tableName]) {
          tableGroups[tableName] = [];
        }
        
        tableGroups[tableName].push({ index: i, data: orderData, dxmClientId });
      } catch (error) {
        // 无法解析客户ID的订单放入异常订单列表
        abnormalOrders.push({ 
          index: i, 
          data: orderData, 
          error: `解析失败: ${error.message}` 
        });
      }

      // 更新分组进度
      if (progressCallback && i % 100 === 0) {
        progressCallback({
          step: '数据分组中...',
          progress: (i / totalOrders) * 15, // 分组占15%进度
          processedItems: i,
          totalItems: totalOrders
        });
      }
    }

    // 处理异常订单（无法解析客户ID的订单）
    if (abnormalOrders.length > 0) {
      if (progressCallback) {
        progressCallback({
          step: `处理异常订单 ${abnormalOrders.length} 条...`,
          progress: 15,
          processedItems: 0,
          totalItems: totalOrders
        });
      }

      try {
        const abnormalResult = await this.insertAbnormalOrders(connection, abnormalOrders);
        results.abnormal = abnormalResult.success;
      } catch (error) {
        console.error(`❌ 异常订单处理失败:`, error);
        results.failed += abnormalOrders.length;
        abnormalOrders.forEach(order => {
          results.errors.push({
            index: order.index,
            data: order.data,
            error: `异常订单处理失败: ${error.message}`
          });
        });
      }
    }

    // 对每个分表执行批量插入
    const tableNames = Object.keys(tableGroups);
    let completedTables = 0;
    const totalNormalOrders = Object.values(tableGroups).reduce((sum, orders) => sum + orders.length, 0);

    for (const [tableName, orders] of Object.entries(tableGroups)) {
      try {
        if (progressCallback) {
          progressCallback({
            step: `正在处理表 ${tableName}...`,
            progress: 20 + (completedTables / tableNames.length) * 70, // 插入占70%进度
            processedItems: processedOrders,
            totalItems: totalOrders
          });
        }

        const batchResult = await this.batchInsertToTable(connection, tableName, orders);
        results.success += batchResult.success;
        results.failed += batchResult.failed;
        if (batchResult.errors) {
          results.errors.push(...batchResult.errors);
        }
        processedOrders += orders.length;
        
      } catch (error) {
        console.error(`❌ 批量插入到表 ${tableName} 失败:`, error);
        results.failed += orders.length;
        processedOrders += orders.length;
        orders.forEach(order => {
          results.errors.push({
            index: order.index,
            data: order.data,
            error: error.message
          });
        });
      }

      completedTables++;
      
      if (progressCallback) {
        progressCallback({
          step: `已完成表 ${tableName}`,
          progress: 20 + (completedTables / tableNames.length) * 70,
          processedItems: processedOrders + results.abnormal,
          totalItems: totalOrders
        });
      }
    }

    // 最终完成
    if (progressCallback) {
      progressCallback({
        step: '导入完成！',
        progress: 100,
        processedItems: totalOrders,
        totalItems: totalOrders
      });
    }

    return results;
  }

  /**
   * 插入异常订单到异常订单表
   * @param {object} connection - 数据库连接
   * @param {Array} abnormalOrders - 异常订单数组
   * @returns {object} 插入结果
   */
  async insertAbnormalOrders(connection, abnormalOrders) {
    if (abnormalOrders.length === 0) {
      return { success: 0, failed: 0, errors: [] };
    }



    const columns = [
      'dxm_order_id', 'dxm_client_id', 'order_id', 'country_code', 'product_count',
      'buyer_name', 'product_name', 'payment_time', 'waybill_number', 'product_sku',
      'product_spu', 'product_parent_spu', 'unit_price', 'multi_total_price', 'discount',
      'settlement_amount', 'remark', 'order_status', 'settlement_status', 'settle_remark', 'parse_error'
    ];

    const values = [];
    const placeholders = [];

    for (const abnormalOrder of abnormalOrders) {
      const orderData = abnormalOrder.data;

      // 异常订单的客户ID和订单ID设为NULL
      values.push(
        orderData.dxm_order_id || null,
        null, // dxm_client_id为NULL
        null, // order_id为NULL
        orderData.country_code || null,
        orderData.product_count || 1,
        orderData.buyer_name || null,
        orderData.product_name || null,
        orderData.payment_time || null,
        orderData.waybill_number || null,
        orderData.product_sku || null,
        orderData.product_spu || null,
        orderData.product_parent_spu || null,
        orderData.unit_price || 0,
        orderData.multi_total_price || 0,
        orderData.discount || 0,
        orderData.settlement_amount || 0,
        orderData.remark ? this.safeJsonStringify(orderData.remark) : null,
        orderData.order_status || null,
        orderData.settlement_status || 'waiting',
        orderData.settle_remark || null,
        abnormalOrder.error // 存储解析错误信息
      );

      placeholders.push(`(${columns.map(() => '?').join(', ')})`);
    }

    const sql = `
      INSERT INTO \`order_abnormal\` (${columns.join(', ')}) 
      VALUES ${placeholders.join(', ')}
      ON DUPLICATE KEY UPDATE
        order_status = VALUES(order_status),
        country_code = VALUES(country_code),
        product_count = VALUES(product_count),
        buyer_name = VALUES(buyer_name),
        product_name = VALUES(product_name),
        payment_time = VALUES(payment_time),
        waybill_number = VALUES(waybill_number),
        product_sku = VALUES(product_sku),
        remark = VALUES(remark),
        parse_error = VALUES(parse_error),
        updated_at = CURRENT_TIMESTAMP
    `;

    try {
      const [result] = await connection.execute(sql, values);
      
      return {
        success: abnormalOrders.length,
        failed: 0,
        errors: [],
        affectedRows: result.affectedRows
      };
      
    } catch (error) {
      console.error(`❌ 异常订单表: 批次处理失败:`, error);
      return {
        success: 0,
        failed: abnormalOrders.length,
        errors: abnormalOrders.map(order => ({
          index: order.index,
          data: order.data,
          error: error.message
        }))
      };
    }
  }

  /**
   * 批量插入到指定表
   * @param {object} connection - 数据库连接
   * @param {string} tableName - 表名
   * @param {Array} orders - 订单数据
   */
  async batchInsertToTable(connection, tableName, orders) {
    if (orders.length === 0) return;

    // 动态设置批次大小，根据数据量优化
    const BATCH_SIZE = getOptimalBatchSize(orders.length);
    
    if (orders.length > BATCH_SIZE) {
      console.log(`📊 ${tableName}: 数据量${orders.length}条超过批次限制，分批处理...`);
      
      // 分批处理
      let totalSuccess = 0;
      let totalFailed = 0;
      const allErrors = [];
      
      for (let i = 0; i < orders.length; i += BATCH_SIZE) {
        const batch = orders.slice(i, i + BATCH_SIZE);
        console.log(`📊 ${tableName}: 处理第${Math.floor(i/BATCH_SIZE) + 1}批, ${batch.length}条记录`);
        const batchResult = await this.processBatch(connection, tableName, batch);
        
        totalSuccess += batchResult.success;
        totalFailed += batchResult.failed;
        if (batchResult.errors) {
          allErrors.push(...batchResult.errors);
        }
      }
      
      return {
        success: totalSuccess,
        failed: totalFailed,
        errors: allErrors
      };
    }
    
    // 单批次处理
    return await this.processBatch(connection, tableName, orders);
  }

  /**
   * 处理单个批次的数据
   * @param {object} connection - 数据库连接
   * @param {string} tableName - 表名
   * @param {Array} orders - 订单数据批次
   * @returns {object} 处理结果
   */
  async processBatch(connection, tableName, orders) {
    try {
      // 准备批量插入数据
    const columns = [
      'dxm_order_id', 'dxm_client_id', 'order_id', 'country_code', 'product_count',
      'buyer_name', 'product_name', 'payment_time', 'waybill_number', 'product_sku',
      'product_spu', 'product_parent_spu', 'unit_price', 'multi_total_price', 'discount',
      'settlement_amount', 'remark', 'order_status', 'settlement_status', 'settle_remark'
    ];

    const values = [];
    const placeholders = [];

    for (const order of orders) {
      const orderData = order.data;
      const dxmClientId = order.dxmClientId;
      const { orderId } = this.parseDxmOrderId(orderData.dxm_order_id);

      // 将undefined转换为null以避免MySQL2错误
      values.push(
        orderData.dxm_order_id || null,
        dxmClientId,
        orderId,
        orderData.country_code || null,
        orderData.product_count || 1,
        orderData.buyer_name || null,
        orderData.product_name || null,
        orderData.payment_time || null,
        orderData.waybill_number || null,
        orderData.product_sku || null,
        orderData.product_spu || null,
        orderData.product_parent_spu || null,
        orderData.unit_price || 0,
        orderData.multi_total_price || 0,
        orderData.discount || 0,
        orderData.settlement_amount || 0,
        orderData.remark ? this.safeJsonStringify(orderData.remark) : null,
        orderData.order_status || null,
        orderData.settlement_status || 'waiting',
        orderData.settle_remark || null
      );

      placeholders.push(`(${columns.map(() => '?').join(', ')})`);
    }

    const sql = `
      INSERT INTO \`${tableName}\` (${columns.join(', ')}) 
      VALUES ${placeholders.join(', ')}
      ON DUPLICATE KEY UPDATE
        order_status = VALUES(order_status),
        country_code = VALUES(country_code),
        product_count = VALUES(product_count),
        buyer_name = VALUES(buyer_name),
        product_name = VALUES(product_name),
        payment_time = VALUES(payment_time),
        waybill_number = VALUES(waybill_number),
        product_sku = VALUES(product_sku),
        remark = VALUES(remark),
        updated_at = CURRENT_TIMESTAMP
    `;

      const [result] = await connection.execute(sql, values);
      

      
      return {
        success: orders.length, // 所有订单都算成功（包括更新的）
        failed: 0,
        errors: [],
        affectedRows: result.affectedRows,
        insertedRows: result.affectedRows - (result.changedRows || 0), // 新插入的行数
        updatedRows: result.changedRows || 0 // 更新的行数
      };
      
    } catch (error) {
      return {
        success: 0,
        failed: orders.length,
        errors: orders.map(order => ({
          index: order.index,
          data: order.data,
          error: error.message
        }))
      };
    }
  }

  /**
   * 根据客户ID查询订单
   * @param {number} dxmClientId - DXM客户ID
   * @param {object} options - 查询选项
   * @returns {Array} 订单列表
   */
  async getOrdersByClientId(dxmClientId, options = {}) {
    const connection = await getConnection();
    const tableName = this.getTableName(dxmClientId);
    
    const {
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'DESC',
      status = null,
      settlementStatus = null,
      buyerName = null,
      paymentTimeStart = null,
      paymentTimeEnd = null
    } = options;

    let sql = `SELECT * FROM \`${tableName}\` WHERE dxm_client_id = ?`;
    const params = [dxmClientId];

    // 添加各种筛选条件
    if (status) {
      sql += ' AND order_status = ?';
      params.push(status);
    }

    if (settlementStatus) {
      sql += ' AND settlement_status = ?';
      params.push(settlementStatus);
    }

    if (buyerName) {
      sql += ' AND buyer_name LIKE ?';
      params.push(`%${buyerName}%`);
    }

    if (paymentTimeStart) {
      sql += ' AND payment_time >= ?';
      params.push(paymentTimeStart);
    }

    if (paymentTimeEnd) {
      sql += ' AND payment_time <= ?';
      params.push(paymentTimeEnd);
    }

    sql += ` ORDER BY ${orderBy} ${orderDirection} LIMIT ${limit} OFFSET ${offset}`;

    const [rows] = await connection.execute(sql, params);
    
    // 获取总记录数（用于分页）
    let countSql = `SELECT COUNT(*) as total FROM \`${tableName}\` WHERE dxm_client_id = ?`;
    const countParams = [dxmClientId];
    
    // 添加相同的筛选条件到计数查询
    if (status) {
      countSql += ' AND order_status = ?';
      countParams.push(status);
    }
    if (settlementStatus) {
      countSql += ' AND settlement_status = ?';
      countParams.push(settlementStatus);
    }
    if (buyerName) {
      countSql += ' AND buyer_name LIKE ?';
      countParams.push(`%${buyerName}%`);
    }
    if (paymentTimeStart) {
      countSql += ' AND payment_time >= ?';
      countParams.push(paymentTimeStart);
    }
    if (paymentTimeEnd) {
      countSql += ' AND payment_time <= ?';
      countParams.push(paymentTimeEnd);
    }
    
    const [countResult] = await connection.execute(countSql, countParams);
    const total = countResult[0].total;
    
    return {
      orders: rows,
      total: total,
      page: Math.floor(offset / limit) + 1,
      limit: limit,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * 根据订单号查询订单
   * @param {string} dxmOrderId - DXM订单号
   * @returns {Array} 订单列表
   */
  async getOrdersByOrderId(dxmOrderId) {
    const { dxmClientId } = this.parseDxmOrderId(dxmOrderId);
    const connection = await getConnection();
    const tableName = this.getTableName(dxmClientId);

    const sql = `SELECT * FROM \`${tableName}\` WHERE dxm_order_id = ? ORDER BY created_at DESC`;
    const [rows] = await connection.execute(sql, [dxmOrderId]);
    
    return rows;
  }

  /**
   * 更新订单状态
   * @param {string} dxmOrderId - DXM订单号
   * @param {object} updateData - 更新数据
   * @returns {object} 更新结果
   */
  async updateOrder(dxmOrderId, updateData) {
    const { dxmClientId } = this.parseDxmOrderId(dxmOrderId);
    const connection = await getConnection();
    const tableName = this.getTableName(dxmClientId);

    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (key === 'remark' && typeof value === 'object') {
        updateFields.push(`${key} = ?`);
        values.push(JSON.stringify(value));
      } else {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    values.push(dxmOrderId);

    const sql = `
      UPDATE \`${tableName}\` 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE dxm_order_id = ?
    `;

    const [result] = await connection.execute(sql, values);
    
    return {
      success: result.affectedRows > 0,
      affectedRows: result.affectedRows
    };
  }

  /**
   * 获取订单统计信息
   * @param {number} dxmClientId - DXM客户ID
   * @returns {object} 统计信息
   */
  async getOrderStats(dxmClientId) {
    const connection = await getConnection();
    const tableName = this.getTableName(dxmClientId);

    const sql = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(DISTINCT order_id) as unique_orders,
        SUM(product_count) as total_products,
        SUM(settlement_amount) as total_settlement,
        order_status,
        settlement_status,
        COUNT(*) as status_count
      FROM \`${tableName}\` 
      WHERE dxm_client_id = ?
      GROUP BY order_status, settlement_status
    `;

    const [rows] = await connection.execute(sql, [dxmClientId]);
    return rows;
  }
}

// 创建单例实例
const orderShardingManager = new OrderShardingManager();

module.exports = orderShardingManager;
