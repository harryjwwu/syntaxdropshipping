const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

/**
 * 获取用户的结算记录列表
 * GET /api/user-settlement/records
 * Query: { page?: number, limit?: number }
 */
router.get('/records', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id; // 从认证中间件获取用户ID

    const pool = await getConnection();
    
    // 首先获取用户的dxm_client_id
    const [userResult] = await pool.execute(
      'SELECT dxm_client_id FROM users WHERE id = ?',
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const dxm_client_id = userResult[0].dxm_client_id;

    if (!dxm_client_id) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
          hasMore: false
        }
      });
    }
    
    // 获取该用户的结算记录
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    
    const [records] = await pool.execute(`
      SELECT id, dxm_client_id, 
             DATE_FORMAT(start_settlement_date, '%Y-%m-%d') as start_settlement_date,
             DATE_FORMAT(end_settlement_date, '%Y-%m-%d') as end_settlement_date,
             total_settlement_amount, order_count, status, notes, created_at, updated_at
      FROM settlement_records
      WHERE dxm_client_id = ?
      ORDER BY created_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `, [dxm_client_id]);
    
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM settlement_records WHERE dxm_client_id = ?',
      [dxm_client_id]
    );
    
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
    console.error('获取用户结算记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取结算记录失败: ' + error.message
    });
  }
});

/**
 * 获取用户结算记录详情和相关订单
 * GET /api/user-settlement/records/:id
 */
router.get('/records/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // 从认证中间件获取用户ID

    const pool = await getConnection();
    
    // 首先获取用户的dxm_client_id
    const [userResult] = await pool.execute(
      'SELECT dxm_client_id FROM users WHERE id = ?',
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const dxm_client_id = userResult[0].dxm_client_id;
    
    // 获取结算记录详情，并验证是否属于该用户
    const [records] = await pool.execute(`
      SELECT id, dxm_client_id, 
             DATE_FORMAT(start_settlement_date, '%Y-%m-%d') as start_settlement_date,
             DATE_FORMAT(end_settlement_date, '%Y-%m-%d') as end_settlement_date,
             total_settlement_amount, order_count, status, notes, created_at, updated_at
      FROM settlement_records
      WHERE id = ? AND dxm_client_id = ?
    `, [id, dxm_client_id]);

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: '结算记录不存在或无权访问'
      });
    }

    const record = records[0];
    
    // 获取相关订单 - 需要查询所有分表
    const allOrders = [];
    
    for (let i = 0; i < 10; i++) {
      const tableName = `orders_${i}`;
      
      try {
        const [orders] = await pool.execute(`
          SELECT id, dxm_order_id, dxm_client_id, order_id, country_code, 
                 product_count, buyer_name, product_name, payment_time,
                 product_sku, product_spu, unit_price, multi_total_price,
                 discount, settlement_amount, settlement_status, settlement_record_id,
                 order_status, remark, settle_remark
          FROM ${tableName}
          WHERE settlement_record_id = ? AND dxm_client_id = ?
          ORDER BY payment_time
        `, [id, dxm_client_id]);
        
        allOrders.push(...orders);
      } catch (error) {
        // 如果表不存在，跳过
        if (!error.message.includes("doesn't exist")) {
          console.error(`查询表 ${tableName} 失败:`, error);
        }
      }
    }

    res.json({
      success: true,
      data: {
        record,
        orders: allOrders
      }
    });

  } catch (error) {
    console.error('获取用户结算记录详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取结算记录详情失败: ' + error.message
    });
  }
});

/**
 * 获取用户结算统计信息
 * GET /api/user-settlement/stats
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getConnection();
    
    // 获取用户的dxm_client_id
    const [userResult] = await pool.execute(
      'SELECT dxm_client_id FROM users WHERE id = ?',
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const dxm_client_id = userResult[0].dxm_client_id;

    if (!dxm_client_id) {
      return res.json({
        success: true,
        data: {
          totalRecords: 0,
          totalAmount: 0,
          totalOrders: 0,
          completedRecords: 0,
          pendingRecords: 0
        }
      });
    }
    
    // 获取统计信息
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalRecords,
        COALESCE(SUM(total_settlement_amount), 0) as totalAmount,
        COALESCE(SUM(order_count), 0) as totalOrders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedRecords,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingRecords
      FROM settlement_records
      WHERE dxm_client_id = ?
    `, [dxm_client_id]);

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('获取用户结算统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取结算统计失败: ' + error.message
    });
  }
});

module.exports = router;
