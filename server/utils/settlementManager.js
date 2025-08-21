const { getConnection } = require('../config/database');

/**
 * 订单结算管理器
 * 实现基于客户的双重折扣结算系统：
 * 1. 用户级折扣：基于24小时内总购买量的阶梯折扣
 * 2. 客户专属价格：基于dxm_client_id的SPU价格表
 */
class SettlementManager {
  constructor() {
    this.tableCount = 10; // 订单分表数量
  }

  /**
   * 根据客户ID计算分表名称
   * @param {number} clientId - 店小蜜客户ID
   * @returns {string} 表名
   */
  getOrderTableName(clientId) {
    const tableIndex = clientId % this.tableCount;
    return `orders_${tableIndex}`;
  }

  /**
   * 获取所有分表名称
   * @returns {Array<string>} 所有订单表名
   */
  getAllOrderTableNames() {
    const tables = [];
    for (let i = 0; i < this.tableCount; i++) {
      tables.push(`orders_${i}`);
    }
    return tables;
  }

  /**
   * 执行指定日期的订单结算
   * @param {string} settlementDate - 结算日期 (YYYY-MM-DD)
   * @param {number} dxm_client_id - 可选的客户ID筛选
   * @returns {Object} 结算结果统计
   */
  async settleOrdersByDate(settlementDate, dxm_client_id = null) {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    const startTime = `${settlementDate} 00:00:00`;
    const endTime = `${settlementDate} 23:59:59`;
    
    console.log(`开始结算 ${settlementDate} 的订单...`);
    
    try {
      await connection.beginTransaction();

      const stats = {
        processedOrders: 0,
        settledOrders: 0,
        cancelledOrders: 0,
        errors: [],
        userDiscounts: 0,
        spuPrices: 0,
        skippedOrders: 0
      };

      // 获取所有表的待结算订单
      const allOrders = await this.getPendingOrders(connection, startTime, endTime, dxm_client_id);
      stats.processedOrders = allOrders.length;

      if (allOrders.length === 0) {
        console.log('没有找到待结算的订单');
        await connection.commit();
        return stats;
      }

      // 步骤0: 检查并处理需要取消结算的订单
      await this.processCancelledOrders(connection, allOrders, stats);

      // 过滤掉已取消的订单，只处理正常订单
      const normalOrders = allOrders.filter(order => order.settlement_status !== 'cancel');
      console.log(`🔍 过滤后待处理订单: ${normalOrders.length} (原始: ${allOrders.length}, 已取消: ${allOrders.length - normalOrders.length})`);

      if (normalOrders.length === 0) {
        console.log('所有订单都已取消，无需进行结算计算');
        await connection.commit();
        return stats;
      }

      // 步骤1: SKU->SPU映射
      await this.mapSkuToSpu(connection, normalOrders, stats);

      // 步骤2-4: 用户级折扣计算
      await this.calculateUserDiscounts(connection, normalOrders, startTime, endTime, stats);

      // 步骤5: 客户专属SPU价格查询和更新
      await this.updateSpuPrices(connection, normalOrders, stats);

      // 步骤6: 最终结算金额计算
      await this.calculateFinalSettlement(connection, normalOrders, stats);

      await connection.commit();
      console.log(`结算完成！处理订单: ${stats.processedOrders}, 成功结算: ${stats.settledOrders}`);
      
      return stats;

    } catch (error) {
      await connection.rollback();
      console.error('结算过程中发生错误:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 获取所有分表中的待结算订单
   * @param {Object} connection - 数据库连接
   * @param {string} startTime - 开始时间
   * @param {string} endTime - 结束时间
   * @param {number} dxm_client_id - 可选的客户ID筛选
   * @returns {Array} 订单列表
   */
  async getPendingOrders(connection, startTime, endTime, dxm_client_id = null) {
    const allOrders = [];
    const tables = this.getAllOrderTableNames();

    for (const tableName of tables) {
      try {
        let query = `
          SELECT id, dxm_order_id, dxm_client_id, order_id, country_code, 
                 product_count, buyer_name, product_name, payment_time,
                 product_sku, product_spu, unit_price, multi_total_price,
                 discount, settlement_amount, settlement_status, order_status,
                 customer_remark, picking_remark, order_remark, settle_remark
          FROM ${tableName}
          WHERE payment_time BETWEEN ? AND ?
            AND settlement_status = 'waiting'`;
        
        let params = [startTime, endTime];
        
        if (dxm_client_id) {
          query += ` AND dxm_client_id = ?`;
          params.push(dxm_client_id);
        }
        
        query += ` ORDER BY dxm_client_id, buyer_name, payment_time`;
        
        const [rows] = await connection.execute(query, params);

        // 为每个订单添加表名信息
        const ordersWithTable = rows.map(order => ({
          ...order,
          _tableName: tableName
        }));

        allOrders.push(...ordersWithTable);
      } catch (error) {
        console.warn(`查询表 ${tableName} 时出错:`, error.message);
      }
    }

    return allOrders;
  }

  /**
   * 处理需要取消结算的订单
   * @param {Object} connection - 数据库连接
   * @param {Array} orders - 订单列表
   * @param {Object} stats - 统计信息
   */
  async processCancelledOrders(connection, orders, stats) {
    let cancelledCount = 0;
    
    for (const order of orders) {
      let shouldCancel = false;
      let cancelReason = '';
      
      // 条件1：订单状态为"已退款"
      if (order.order_status === '已退款') {
        shouldCancel = true;
        cancelReason = '订单状态为已退款，无需结算';
      }
      // 条件2：备注中包含"不结算"
      else if (this.checkRemarkContainsNoSettlement(order)) {
        shouldCancel = true;
        cancelReason = '备注中标记不结算，无需结算';
      }
      // 条件3：SKU为Upsell
      else if (order.product_sku === 'Upsell') {
        shouldCancel = true;
        cancelReason = 'SKU为Upsell产品，无需结算';
      }
      
      if (shouldCancel) {
        try {
          // 更新订单状态为cancel
          await connection.execute(`
            UPDATE ${order._tableName}
            SET settlement_status = 'cancel',
                settle_remark = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [cancelReason, order.id]);
          
          // 标记订单为已取消（用于后续过滤）
          order.settlement_status = 'cancel';
          order.settle_remark = cancelReason;
          
          cancelledCount++;
          console.log(`🚫 订单 ${order.dxm_order_id} 已取消结算: ${cancelReason}`);
        } catch (error) {
          console.error(`❌ 取消订单 ${order.id} 结算时出错:`, error);
          stats.errors.push(`取消结算错误: ${order.id} - ${error.message}`);
        }
      }
    }
    
    if (cancelledCount > 0) {
      console.log(`🚫 共取消 ${cancelledCount} 个订单的结算`);
      stats.cancelledOrders = cancelledCount;
    }
  }

  /**
   * 检查备注是否包含"不结算"
   * @param {Object} order - 订单数据
   * @returns {boolean} 是否包含不结算标记
   */
  checkRemarkContainsNoSettlement(order) {
    // 检查三个备注字段：客服备注、拣货备注、订单备注
    const remarksToCheck = [
      order.customer_remark,
      order.picking_remark,
      order.order_remark,
      order.settle_remark  // 也检查结算备注
    ];
    
    for (const remark of remarksToCheck) {
      if (remark && typeof remark === 'string' && remark.includes('不结算')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * SKU到SPU映射
   * @param {Object} connection - 数据库连接
   * @param {Array} orders - 订单列表
   * @param {Object} stats - 统计信息
   */
  async mapSkuToSpu(connection, orders, stats) {
    const skuToSpuMap = new Map();
    const uniqueSkus = [...new Set(orders.map(order => order.product_sku).filter(sku => sku))];

    if (uniqueSkus.length > 0) {
      const [spuRows] = await connection.execute(`
        SELECT sku, spu FROM sku_spu_relations 
        WHERE sku IN (${uniqueSkus.map(() => '?').join(',')})
      `, uniqueSkus);

      spuRows.forEach(row => {
        skuToSpuMap.set(row.sku, row.spu);
      });
    }

    // 更新订单的product_spu字段
    for (const order of orders) {
      if (order.product_sku && !order.product_spu) {
        const spu = skuToSpuMap.get(order.product_sku);
        if (spu) {
          order.product_spu = spu;
          // 更新数据库
          await connection.execute(`
            UPDATE ${order._tableName} 
            SET product_spu = ? 
            WHERE id = ?
          `, [spu, order.id]);
        }
      }
    }
  }

  /**
   * 计算用户级折扣
   * @param {Object} connection - 数据库连接
   * @param {Array} orders - 订单列表
   * @param {string} startTime - 开始时间
   * @param {string} endTime - 结束时间
   * @param {Object} stats - 统计信息
   */
  async calculateUserDiscounts(connection, orders, startTime, endTime, stats) {
    // 按用户分组计算总购买量
    const userGroups = new Map();
    
    orders.forEach(order => {
      const userKey = `${order.dxm_client_id}_${order.buyer_name}`;
      if (!userGroups.has(userKey)) {
        userGroups.set(userKey, {
          dxm_client_id: order.dxm_client_id,
          buyer_name: order.buyer_name,
          orders: [],
          totalQuantity: 0
        });
      }
      const group = userGroups.get(userKey);
      group.orders.push(order);
      group.totalQuantity += order.product_count || 0;
    });

    // 为每个用户组查询折扣规则并更新订单
    for (const [userKey, group] of userGroups) {
      try {
        // 查询用户折扣规则
        const [discountRows] = await connection.execute(`
          SELECT discount_rate 
          FROM user_discount_rules 
          WHERE dxm_client_id = ? 
            AND min_quantity <= ? 
            AND max_quantity >= ?
          ORDER BY min_quantity DESC
          LIMIT 1
        `, [group.dxm_client_id, group.totalQuantity, group.totalQuantity]);

        const discountRate = discountRows.length > 0 ? discountRows[0].discount_rate : 1.0;

        // 更新该用户组所有订单的折扣
        for (const order of group.orders) {
          order.discount = discountRate;
          
          await connection.execute(`
            UPDATE ${order._tableName} 
            SET discount = ? 
            WHERE id = ?
          `, [discountRate, order.id]);
        }

        stats.userDiscounts++;
      } catch (error) {
        console.error(`计算用户 ${userKey} 折扣时出错:`, error);
        stats.errors.push(`用户折扣计算错误: ${userKey} - ${error.message}`);
      }
    }
  }

  /**
   * 更新客户专属SPU价格
   * @param {Object} connection - 数据库连接
   * @param {Array} orders - 订单列表
   * @param {Object} stats - 统计信息
   */
  async updateSpuPrices(connection, orders, stats) {
    for (const order of orders) {
      if (!order.product_spu || !order.country_code) {
        // 缺少必要信息，标记为等待状态
        await connection.execute(`
          UPDATE ${order._tableName} 
          SET settle_remark = '缺少SPU或国家代码信息，无法查询价格' 
          WHERE id = ?
        `, [order.id]);
        continue;
      }

      try {
        // 查询客户专属SPU价格
        const [priceRows] = await connection.execute(`
          SELECT total_price 
          FROM spu_prices 
          WHERE dxm_client_id = ? 
            AND spu = ? 
            AND country_code = ? 
            AND quantity = ?
          LIMIT 1
        `, [order.dxm_client_id, order.product_spu, order.country_code, order.product_count]);

        if (priceRows.length > 0) {
          const totalPrice = priceRows[0].total_price;
          
          // 根据订单数量决定更新哪个字段
          if (order.product_count === 1) {
            // 单件商品，更新unit_price
            order.unit_price = totalPrice;
            await connection.execute(`
              UPDATE ${order._tableName} 
              SET unit_price = ? 
              WHERE id = ?
            `, [totalPrice, order.id]);
          } else {
            // 多件商品，更新multi_total_price
            order.multi_total_price = totalPrice;
            await connection.execute(`
              UPDATE ${order._tableName} 
              SET multi_total_price = ? 
              WHERE id = ?
            `, [totalPrice, order.id]);
          }

          stats.spuPrices++;
        } else {
          // 未找到客户专属价格，保持waiting状态并更新说明
          await connection.execute(`
            UPDATE ${order._tableName} 
            SET settle_remark = '未找到客户专属价格，请赶紧录入报价' 
            WHERE id = ?
          `, [order.id]);
          
          // 标记此订单为未找到价格，后续跳过结算
          order._noPriceFound = true;
        }
      } catch (error) {
        console.error(`查询订单 ${order.id} SPU价格时出错:`, error);
        stats.errors.push(`SPU价格查询错误: ${order.id} - ${error.message}`);
        
        // 出错时也标记为等待状态
        await connection.execute(`
          UPDATE ${order._tableName} 
          SET settle_remark = ? 
          WHERE id = ?
        `, [`价格查询出错: ${error.message}`, order.id]);
        
        order._noPriceFound = true;
      }
    }
  }

  /**
   * 计算最终结算金额
   * @param {Object} connection - 数据库连接
   * @param {Array} orders - 订单列表
   * @param {Object} stats - 统计信息
   */
  async calculateFinalSettlement(connection, orders, stats) {
    for (const order of orders) {
      // 跳过未找到价格的订单
      if (order._noPriceFound) {
        stats.skippedOrders++;
        continue;
      }

      try {
        let settlementAmount = 0;
        let settlementRemark = '';

        if (order.multi_total_price && order.multi_total_price > 0) {
          // 使用多件商品专属价格
          settlementAmount = order.multi_total_price;
          settlementRemark = `多件价格结算: ${order.multi_total_price}`;
        } else if (order.unit_price && order.unit_price > 0 && order.discount) {
          // 使用单件价格 × 用户折扣
          settlementAmount = order.unit_price * order.discount;
          settlementRemark = `单件价格×用户折扣结算: ${order.unit_price} × ${order.discount} = ${settlementAmount.toFixed(2)}`;
        } else {
          // 无法计算结算金额，保持waiting状态
          await connection.execute(`
            UPDATE ${order._tableName} 
            SET settle_remark = '缺少价格或折扣信息，无法结算' 
            WHERE id = ?
          `, [order.id]);
          
          stats.skippedOrders++;
          continue;
        }

        // 更新最终结算信息
        await connection.execute(`
          UPDATE ${order._tableName} 
          SET settlement_amount = ?,
              settlement_status = 'calculated',
              settle_remark = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [settlementAmount, settlementRemark, order.id]);

        stats.settledOrders++;
      } catch (error) {
        console.error(`计算订单 ${order.id} 最终结算金额时出错:`, error);
        stats.errors.push(`最终结算计算错误: ${order.id} - ${error.message}`);
      }
    }
  }

  /**
   * 重新结算指定订单（支持重复结算）
   * @param {Array} orderIds - 订单ID列表
   * @param {string} settlementDate - 结算日期
   * @returns {Object} 结算结果
   */
  async reSettleOrders(orderIds, settlementDate) {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 先将指定订单状态重置为waiting
      const tables = this.getAllOrderTableNames();
      for (const tableName of tables) {
        await connection.execute(`
          UPDATE ${tableName} 
          SET settlement_status = 'waiting',
              settlement_amount = 0,
              discount = 0,
              multi_total_price = 0,
              settle_remark = NULL
          WHERE id IN (${orderIds.map(() => '?').join(',')})
        `, orderIds);
      }

      await connection.commit();

      // 重新执行结算
      return await this.settleOrdersByDate(settlementDate);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 获取结算统计信息
   * @param {string} settlementDate - 结算日期
   * @returns {Object} 统计信息
   */
  async getSettlementStats(settlementDate) {
    const pool = await getConnection();
    const startTime = `${settlementDate} 00:00:00`;
    const endTime = `${settlementDate} 23:59:59`;

    const stats = {
      totalOrders: 0,
      calculatedOrders: 0,
      settledOrders: 0,
      waitingOrders: 0,
      cancelledOrders: 0,
      totalSettlementAmount: 0
    };

    const tables = this.getAllOrderTableNames();
    
    for (const tableName of tables) {
      try {
        const [rows] = await pool.execute(`
          SELECT 
            settlement_status,
            COUNT(*) as count,
            COALESCE(SUM(settlement_amount), 0) as total_amount
          FROM ${tableName}
          WHERE payment_time BETWEEN ? AND ?
          GROUP BY settlement_status
        `, [startTime, endTime]);

        rows.forEach(row => {
          stats.totalOrders += row.count;
          if (row.settlement_status === 'calculated') {
            stats.calculatedOrders += row.count;
            stats.totalSettlementAmount += parseFloat(row.total_amount);
          } else if (row.settlement_status === 'settled') {
            stats.settledOrders += row.count;
            stats.totalSettlementAmount += parseFloat(row.total_amount);
          } else if (row.settlement_status === 'waiting') {
            stats.waitingOrders += row.count;
          } else if (row.settlement_status === 'cancel') {
            stats.cancelledOrders += row.count;
          }
        });
      } catch (error) {
        console.warn(`查询表 ${tableName} 统计信息时出错:`, error.message);
      }
    }

    return stats;
  }
}

module.exports = SettlementManager;
