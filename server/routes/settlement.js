const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/adminAuth');
const { getConnection } = require('../config/database');
const SettlementManager = require('../utils/settlementManager');

const settlementManager = new SettlementManager();

/**
 * 手动触发结算计算
 * POST /api/settlement/calculate
 * Body: { settlementDate: "YYYY-MM-DD", dxm_client_id?: number }
 */
router.post('/calculate', authenticateAdmin, async (req, res) => {
  try {
    const { settlementDate, dxm_client_id } = req.body;

    if (!settlementDate) {
      return res.status(400).json({
        success: false,
        message: '请提供结算日期'
      });
    }

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(settlementDate)) {
      return res.status(400).json({
        success: false,
        message: '日期格式错误，请使用 YYYY-MM-DD 格式'
      });
    }

    // 验证不能选择当天
    const today = new Date().toISOString().split('T')[0];
    if (settlementDate >= today) {
      return res.status(400).json({
        success: false,
        message: '只能选择前一天的日期，不能选择当天或未来日期'
      });
    }

    console.log(`管理员 ${req.admin.email} 手动触发结算计算 ${settlementDate} 的订单${dxm_client_id ? ` (客户ID: ${dxm_client_id})` : ''}`);

    const startTime = Date.now();
    const stats = await settlementManager.settleOrdersByDate(settlementDate, dxm_client_id);
    const endTime = Date.now();

    res.json({
      success: true,
      message: '结算计算完成',
      data: {
        settlementDate,
        dxm_client_id: dxm_client_id || 'all',
        processingTime: `${endTime - startTime}ms`,
        ...stats
      }
    });

  } catch (error) {
    console.error('结算计算失败:', error);
    res.status(500).json({
      success: false,
      message: '结算计算失败: ' + error.message,
      error: error.stack
    });
  }
});

/**
 * 获取指定客户的结算订单列表
 * GET /api/settlement/orders
 * Query: { settlementDate: "YYYY-MM-DD", dxm_client_id: number }
 */
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    const { settlementDate, dxm_client_id } = req.query;

    if (!settlementDate || !dxm_client_id) {
      return res.status(400).json({
        success: false,
        message: '请提供结算日期和客户ID'
      });
    }

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(settlementDate)) {
      return res.status(400).json({
        success: false,
        message: '日期格式错误，请使用 YYYY-MM-DD 格式'
      });
    }

    const pool = await getConnection();
    const startTime = `${settlementDate} 00:00:00`;
    const endTime = `${settlementDate} 23:59:59`;

    // 获取所有分表的订单数据
    const allOrders = [];
    const waitingOrders = [];
    const calculatedOrders = [];
    
    const tables = settlementManager.getAllOrderTableNames();
    
    for (const tableName of tables) {
      try {
        const [rows] = await pool.execute(`
          SELECT id, dxm_order_id, dxm_client_id, order_id, country_code, 
                 product_count, buyer_name, product_name, payment_time,
                 product_sku, product_spu, unit_price, multi_total_price,
                 discount, settlement_amount, settlement_status, settlement_record_id,
                 order_status, remark, settle_remark
          FROM ${tableName}
          WHERE payment_time BETWEEN ? AND ?
            AND dxm_client_id = ?
          ORDER BY payment_time
        `, [startTime, endTime, dxm_client_id]);

        const ordersWithTable = rows.map(order => ({
          ...order,
          _tableName: tableName
        }));

        allOrders.push(...ordersWithTable);
        
        // 分类订单状态
        ordersWithTable.forEach(order => {
          if (order.settlement_status === 'waiting') {
            waitingOrders.push(order);
          } else if (order.settlement_status === 'calculated') {
            calculatedOrders.push(order);
          }
        });
      } catch (error) {
        console.warn(`查询表 ${tableName} 时出错:`, error.message);
      }
    }

    // 计算统计信息
    const totalSettlementAmount = calculatedOrders.reduce((sum, order) => 
      sum + parseFloat(order.settlement_amount || 0), 0
    );

    res.json({
      success: true,
      data: {
        settlementDate,
        dxm_client_id: parseInt(dxm_client_id),
        summary: {
          totalOrders: allOrders.length,
          waitingOrders: waitingOrders.length,
          calculatedOrders: calculatedOrders.length,
          totalSettlementAmount: totalSettlementAmount.toFixed(2),
          canSettle: waitingOrders.length === 0 && calculatedOrders.length > 0
        },
        orders: {
          all: allOrders,
          waiting: waitingOrders,
          calculated: calculatedOrders
        }
      }
    });

  } catch (error) {
    console.error('获取结算订单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败: ' + error.message
    });
  }
});

/**
 * 执行结算收款
 * POST /api/settlement/execute
 * Body: { settlementDate: "YYYY-MM-DD", dxm_client_id: number }
 */
router.post('/execute', authenticateAdmin, async (req, res) => {
  try {
    const { settlementDate, dxm_client_id } = req.body;

    if (!settlementDate || !dxm_client_id) {
      return res.status(400).json({
        success: false,
        message: '请提供结算日期和客户ID'
      });
    }

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(settlementDate)) {
      return res.status(400).json({
        success: false,
        message: '日期格式错误，请使用 YYYY-MM-DD 格式'
      });
    }

    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const startTime = `${settlementDate} 00:00:00`;
      const endTime = `${settlementDate} 23:59:59`;

      // 检查是否有waiting状态的订单
      const tables = settlementManager.getAllOrderTableNames();
      let hasWaitingOrders = false;
      let calculatedOrders = [];

      for (const tableName of tables) {
        const [waitingCheck] = await connection.execute(`
          SELECT COUNT(*) as count FROM ${tableName}
          WHERE payment_time BETWEEN ? AND ?
            AND dxm_client_id = ?
            AND settlement_status = 'waiting'
        `, [startTime, endTime, dxm_client_id]);

        if (waitingCheck[0].count > 0) {
          hasWaitingOrders = true;
          break;
        }

        // 获取calculated状态的订单
        const [calculatedRows] = await connection.execute(`
          SELECT id, settlement_amount FROM ${tableName}
          WHERE payment_time BETWEEN ? AND ?
            AND dxm_client_id = ?
            AND settlement_status = 'calculated'
        `, [startTime, endTime, dxm_client_id]);

        calculatedOrders.push(...calculatedRows.map(order => ({
          ...order,
          _tableName: tableName
        })));
      }

      if (hasWaitingOrders) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: '存在等待计算的订单，请先完成结算计算再执行结算'
        });
      }

      if (calculatedOrders.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: '没有找到可结算的订单'
        });
      }

      // 计算总结算金额
      const totalSettlementAmount = calculatedOrders.reduce((sum, order) => 
        sum + parseFloat(order.settlement_amount || 0), 0
      );

      // 生成结算记录ID
      const dateStr = settlementDate.replace(/-/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const settlementRecordId = `${dateStr}${randomNum}`;

      // 创建结算记录
      await connection.execute(`
        INSERT INTO settlement_records 
        (id, dxm_client_id, settlement_date, total_settlement_amount, order_count, created_by, status)
        VALUES (?, ?, ?, ?, ?, ?, 'completed')
      `, [settlementRecordId, dxm_client_id, settlementDate, totalSettlementAmount, calculatedOrders.length, req.admin.id]);

      // 更新所有相关订单状态为settled，并关联结算记录ID
      for (const order of calculatedOrders) {
        await connection.execute(`
          UPDATE ${order._tableName}
          SET settlement_status = 'settled',
              settlement_record_id = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [settlementRecordId, order.id]);
      }

      await connection.commit();

      console.log(`管理员 ${req.admin.email} 完成结算: ${settlementRecordId}, 客户: ${dxm_client_id}, 金额: ${totalSettlementAmount}`);

      res.json({
        success: true,
        message: '结算执行成功',
        data: {
          settlementRecordId,
          settlementDate,
          dxm_client_id: parseInt(dxm_client_id),
          totalSettlementAmount: totalSettlementAmount.toFixed(2),
          orderCount: calculatedOrders.length
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('执行结算失败:', error);
    res.status(500).json({
      success: false,
      message: '执行结算失败: ' + error.message
    });
  }
});

/**
 * 重新结算指定订单
 * POST /api/settlement/re-settle
 * Body: { orderIds: [1,2,3], settlementDate: "YYYY-MM-DD" }
 */
router.post('/re-settle', authenticateAdmin, async (req, res) => {
  try {
    const { orderIds, settlementDate } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要重新结算的订单ID列表'
      });
    }

    if (!settlementDate) {
      return res.status(400).json({
        success: false,
        message: '请提供结算日期'
      });
    }

    console.log(`管理员 ${req.admin.email} 重新结算订单:`, orderIds);

    const startTime = Date.now();
    const stats = await settlementManager.reSettleOrders(orderIds, settlementDate);
    const endTime = Date.now();

    res.json({
      success: true,
      message: '重新结算完成',
      data: {
        settlementDate,
        reSettledOrderIds: orderIds,
        processingTime: `${endTime - startTime}ms`,
        ...stats
      }
    });

  } catch (error) {
    console.error('重新结算失败:', error);
    res.status(500).json({
      success: false,
      message: '重新结算失败: ' + error.message
    });
  }
});

/**
 * 获取结算统计信息
 * GET /api/settlement/stats/:date
 */
router.get('/stats/:date', authenticateAdmin, async (req, res) => {
  try {
    const { date } = req.params;

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: '日期格式错误，请使用 YYYY-MM-DD 格式'
      });
    }

    const stats = await settlementManager.getSettlementStats(date);

    res.json({
      success: true,
      data: {
        settlementDate: date,
        ...stats
      }
    });

  } catch (error) {
    console.error('获取结算统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败: ' + error.message
    });
  }
});

/**
 * 批量结算多个日期
 * POST /api/settlement/batch-settle
 * Body: { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" }
 */
router.post('/batch-settle', authenticateAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: '请提供开始日期和结束日期'
      });
    }

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        message: '日期格式错误，请使用 YYYY-MM-DD 格式'
      });
    }

    // 生成日期范围
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    if (dates.length > 31) {
      return res.status(400).json({
        success: false,
        message: '批量结算日期范围不能超过31天'
      });
    }

    console.log(`管理员 ${req.admin.email} 开始批量结算 ${startDate} 到 ${endDate}`);

    const batchResults = [];
    let totalProcessed = 0;
    let totalSettled = 0;

    for (const date of dates) {
      try {
        const stats = await settlementManager.settleOrdersByDate(date);
        batchResults.push({
          date,
          success: true,
          ...stats
        });
        totalProcessed += stats.processedOrders;
        totalSettled += stats.settledOrders;
      } catch (error) {
        console.error(`结算 ${date} 失败:`, error);
        batchResults.push({
          date,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: '批量结算完成',
      data: {
        dateRange: { startDate, endDate },
        totalDays: dates.length,
        totalProcessedOrders: totalProcessed,
        totalSettledOrders: totalSettled,
        results: batchResults
      }
    });

  } catch (error) {
    console.error('批量结算失败:', error);
    res.status(500).json({
      success: false,
      message: '批量结算失败: ' + error.message
    });
  }
});

/**
 * 获取结算日志
 * GET /api/settlement/logs
 */
router.get('/logs', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, date, status } = req.query;
    
    // 这里可以实现结算日志查询逻辑
    // 暂时返回模拟数据结构
    res.json({
      success: true,
      data: {
        logs: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        }
      }
    });

  } catch (error) {
    console.error('获取结算日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取日志失败: ' + error.message
    });
  }
});

/**
 * 获取结算记录列表
 * GET /api/settlement/records
 * Query: { page?: number, limit?: number, dxm_client_id?: number }
 */
router.get('/records', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, dxm_client_id } = req.query;
    const offset = (page - 1) * limit;

    const pool = await getConnection();
    
    let query = `
      SELECT id, dxm_client_id, settlement_date, total_settlement_amount, 
             order_count, status, created_by, notes, created_at, updated_at
      FROM settlement_records
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM settlement_records';
    let params = [];
    let countParams = [];
    
    if (dxm_client_id) {
      query += ' WHERE dxm_client_id = ?';
      countQuery += ' WHERE dxm_client_id = ?';
      params.push(dxm_client_id);
      countParams.push(dxm_client_id);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    const [records] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasMore: page < totalPages
      }
    });

  } catch (error) {
    console.error('获取结算记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取结算记录失败: ' + error.message
    });
  }
});

/**
 * 获取结算记录详情和相关订单
 * GET /api/settlement/records/:id
 */
router.get('/records/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await getConnection();
    
    // 获取结算记录详情
    const [records] = await pool.execute(`
      SELECT id, dxm_client_id, settlement_date, total_settlement_amount, 
             order_count, status, created_by, notes, created_at, updated_at
      FROM settlement_records
      WHERE id = ?
    `, [id]);

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: '结算记录不存在'
      });
    }

    const record = records[0];
    
    // 获取相关订单列表
    const allOrders = [];
    const tables = settlementManager.getAllOrderTableNames();
    
    for (const tableName of tables) {
      try {
        const [orders] = await pool.execute(`
          SELECT id, dxm_order_id, dxm_client_id, order_id, country_code, 
                 product_count, buyer_name, product_name, payment_time,
                 product_sku, product_spu, unit_price, multi_total_price,
                 discount, settlement_amount, settlement_status, settlement_record_id,
                 order_status, remark, settle_remark
          FROM ${tableName}
          WHERE settlement_record_id = ?
          ORDER BY payment_time
        `, [id]);

        const ordersWithTable = orders.map(order => ({
          ...order,
          _tableName: tableName
        }));

        allOrders.push(...ordersWithTable);
      } catch (error) {
        console.warn(`查询表 ${tableName} 时出错:`, error.message);
      }
    }

    res.json({
      success: true,
      data: {
        record,
        orders: allOrders,
        orderCount: allOrders.length
      }
    });

  } catch (error) {
    console.error('获取结算记录详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取结算记录详情失败: ' + error.message
    });
  }
});

/**
 * 取消订单结算
 * POST /api/settlement/cancel
 * Body: { orderIds: [1,2,3], reason: "取消原因" }
 */
router.post('/cancel', authenticateAdmin, async (req, res) => {
  try {
    const { orderIds, reason } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要取消结算的订单ID列表'
      });
    }

    // 这里实现取消结算的逻辑
    // 将订单状态设置为 'cancel'
    const pool = await getConnection();
    const connection = await pool.getConnection();

    const tables = settlementManager.getAllOrderTableNames();
    let cancelledCount = 0;

    for (const tableName of tables) {
      const [result] = await connection.execute(`
        UPDATE ${tableName} 
        SET settlement_status = 'cancel',
            settle_remark = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${orderIds.map(() => '?').join(',')})
          AND settlement_status IN ('waiting', 'settled')
      `, [reason || '管理员取消结算', ...orderIds]);

      cancelledCount += result.affectedRows;
    }

    console.log(`管理员 ${req.admin.email} 取消了 ${cancelledCount} 个订单的结算`);

    res.json({
      success: true,
      message: '取消结算完成',
      data: {
        cancelledOrderIds: orderIds,
        cancelledCount,
        reason
      }
    });

  } catch (error) {
    console.error('取消结算失败:', error);
    res.status(500).json({
      success: false,
      message: '取消结算失败: ' + error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;
