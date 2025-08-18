const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/adminAuth');
const { getConnection } = require('../config/database');

// 获取价格变更历史列表
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { 
      page = 1, 
      limit = 20, 
      spu = '', 
      country_code = '', 
      quantity = '',
      change_type = '',
      start_date = '',
      end_date = ''
    } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    // 搜索条件
    if (spu) {
      whereClause += ' AND sph.spu = ?';
      params.push(spu);
    }
    
    if (country_code) {
      whereClause += ' AND sph.country_code = ?';
      params.push(country_code);
    }
    
    if (quantity) {
      whereClause += ' AND sph.quantity = ?';
      params.push(parseInt(quantity));
    }
    
    if (change_type) {
      whereClause += ' AND sph.change_type = ?';
      params.push(change_type);
    }
    
    if (start_date) {
      whereClause += ' AND sph.created_at >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      whereClause += ' AND sph.created_at <= ?';
      params.push(end_date + ' 23:59:59');
    }
    
    // 获取历史记录列表
    const [history] = await pool.execute(`
      SELECT 
        sph.*,
        s.name as spu_name,
        c.name as country_name,
        c.name_cn as country_name_cn
      FROM spu_price_history sph
      LEFT JOIN spus s ON sph.spu = s.spu
      LEFT JOIN countries c ON sph.country_code = c.code
      ${whereClause}
      ORDER BY sph.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, params);
    
    // 获取总数
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM spu_price_history sph
      LEFT JOIN spus s ON sph.spu = s.spu
      ${whereClause}
    `, params);
    
    const total = countResult[0].total;
    const pages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
    
  } catch (error) {
    console.error('获取价格历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取价格历史失败'
    });
  }
});

// 获取特定SPU的价格历史
router.get('/spu/:spu', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { spu } = req.params;
    const { country_code = '', quantity = '' } = req.query;
    
    let whereClause = 'WHERE sph.spu = ?';
    const params = [spu];
    
    if (country_code) {
      whereClause += ' AND sph.country_code = ?';
      params.push(country_code);
    }
    
    if (quantity) {
      whereClause += ' AND sph.quantity = ?';
      params.push(parseInt(quantity));
    }
    
    const [history] = await pool.execute(`
      SELECT 
        sph.*,
        s.name as spu_name,
        c.name as country_name,
        c.name_cn as country_name_cn
      FROM spu_price_history sph
      LEFT JOIN spus s ON sph.spu = s.spu
      LEFT JOIN countries c ON sph.country_code = c.code
      ${whereClause}
      ORDER BY sph.created_at DESC
    `, params);
    
    res.json({
      success: true,
      data: history
    });
    
  } catch (error) {
    console.error('获取SPU价格历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取SPU价格历史失败'
    });
  }
});

// 获取价格变更统计
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { days = 30 } = req.query;
    
    // 获取指定天数内的变更统计
    const [stats] = await pool.execute(`
      SELECT 
        change_type,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM spu_price_history
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY change_type, DATE(created_at)
      ORDER BY date DESC
    `, [parseInt(days)]);
    
    // 获取总体统计
    const [totalStats] = await pool.execute(`
      SELECT 
        change_type,
        COUNT(*) as total_count
      FROM spu_price_history
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY change_type
    `, [parseInt(days)]);
    
    // 获取最活跃的SPU
    const [activeSpu] = await pool.execute(`
      SELECT 
        sph.spu,
        s.name as spu_name,
        COUNT(*) as change_count
      FROM spu_price_history sph
      LEFT JOIN spus s ON sph.spu = s.spu
      WHERE sph.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY sph.spu, s.name
      ORDER BY change_count DESC
      LIMIT 10
    `, [parseInt(days)]);
    
    res.json({
      success: true,
      data: {
        dailyStats: stats,
        totalStats: totalStats,
        activeSpu: activeSpu
      }
    });
    
  } catch (error) {
    console.error('获取价格变更统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取价格变更统计失败'
    });
  }
});

// 记录价格变更历史（内部使用）
async function recordPriceHistory(pool, {
  spu,
  country_code,
  quantity,
  oldPrice = null,
  newPrice,
  change_type,
  change_reason = '',
  admin_id = null,
  admin_name = ''
}) {
  try {
    await pool.execute(`
      INSERT INTO spu_price_history (
        spu, country_code, quantity,
        old_product_cost, old_shipping_cost, old_packing_cost, old_vat_cost, old_total_price,
        new_product_cost, new_shipping_cost, new_packing_cost, new_vat_cost, new_total_price,
        change_type, change_reason, admin_id, admin_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      spu, country_code, quantity,
      oldPrice?.product_cost || 0, oldPrice?.shipping_cost || 0, oldPrice?.packing_cost || 0, oldPrice?.vat_cost || 0, oldPrice?.total_price || 0,
      newPrice.product_cost, newPrice.shipping_cost, newPrice.packing_cost, newPrice.vat_cost, newPrice.total_price,
      change_type, change_reason, admin_id, admin_name
    ]);
    
    console.log(`📝 记录价格变更历史: ${spu} - ${country_code} - ${quantity} - ${change_type}`);
  } catch (error) {
    console.error('记录价格变更历史失败:', error);
    // 不抛出错误，避免影响主要业务流程
  }
}

module.exports = {
  router,
  recordPriceHistory
};
