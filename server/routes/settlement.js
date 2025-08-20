const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const SettlementManager = require('../utils/settlementManager');

const settlementManager = new SettlementManager();

/**
 * 执行指定日期的订单结算
 * POST /api/settlement/settle
 * Body: { settlementDate: "YYYY-MM-DD" }
 */
router.post('/settle', adminAuth, async (req, res) => {
  try {
    const { settlementDate } = req.body;

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

    console.log(`管理员 ${req.user.email} 开始结算 ${settlementDate} 的订单`);

    const startTime = Date.now();
    const stats = await settlementManager.settleOrdersByDate(settlementDate);
    const endTime = Date.now();

    res.json({
      success: true,
      message: '结算完成',
      data: {
        settlementDate,
        processingTime: `${endTime - startTime}ms`,
        ...stats
      }
    });

  } catch (error) {
    console.error('订单结算失败:', error);
    res.status(500).json({
      success: false,
      message: '结算失败: ' + error.message,
      error: error.stack
    });
  }
});

/**
 * 重新结算指定订单
 * POST /api/settlement/re-settle
 * Body: { orderIds: [1,2,3], settlementDate: "YYYY-MM-DD" }
 */
router.post('/re-settle', adminAuth, async (req, res) => {
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

    console.log(`管理员 ${req.user.email} 重新结算订单:`, orderIds);

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
router.get('/stats/:date', adminAuth, async (req, res) => {
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
router.post('/batch-settle', adminAuth, async (req, res) => {
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

    console.log(`管理员 ${req.user.email} 开始批量结算 ${startDate} 到 ${endDate}`);

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
router.get('/logs', adminAuth, async (req, res) => {
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
 * 取消订单结算
 * POST /api/settlement/cancel
 * Body: { orderIds: [1,2,3], reason: "取消原因" }
 */
router.post('/cancel', adminAuth, async (req, res) => {
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
    const { getConnection } = require('../config/database');
    const connection = await getConnection();

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

    console.log(`管理员 ${req.user.email} 取消了 ${cancelledCount} 个订单的结算`);

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
  }
});

module.exports = router;
