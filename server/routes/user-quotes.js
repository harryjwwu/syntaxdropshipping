const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getConnection } = require('../config/database');

/**
 * 获取用户的SPU报价列表
 * GET /api/quotes
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getConnection();
    
    // 获取用户的dxm_client_id
    const [userRows] = await pool.execute(
      'SELECT dxm_client_id FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0 || !userRows[0].dxm_client_id) {
      return res.status(404).json({
        success: false,
        message: '用户不存在或未分配客户ID'
      });
    }
    
    const dxmClientId = userRows[0].dxm_client_id;
    
    const { 
      page = 1, 
      limit = 20, 
      spu = '', 
      country_code = '', 
      search = ''
    } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE sp.dxm_client_id = ?';
    const params = [dxmClientId];
    
    // 搜索条件
    if (spu) {
      whereClause += ' AND sp.spu = ?';
      params.push(spu);
    }
    
    if (country_code) {
      whereClause += ' AND sp.country_code = ?';
      params.push(country_code);
    }
    
    if (search) {
      whereClause += ' AND (s.name LIKE ? OR sp.spu LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // 获取报价列表 - 使用字符串插值避免MySQL2驱动的LIMIT/OFFSET参数绑定问题
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    const [quotes] = await pool.execute(`
      SELECT 
        sp.*,
        s.name as spu_name,
        s.photo as spu_photo,
        s.logistics_methods,
        s.weight,
        c.name as country_name,
        c.name_cn as country_name_cn
      FROM spu_prices sp
      LEFT JOIN spus s ON sp.spu = s.spu
      LEFT JOIN countries c ON sp.country_code = c.code
      ${whereClause}
      ORDER BY sp.created_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `, [...params]);
    
    // 获取总数
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM spu_prices sp
      LEFT JOIN spus s ON sp.spu = s.spu
      ${whereClause}
    `, params);
    
    const total = countResult[0].total;
    const pages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: quotes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
    
  } catch (error) {
    console.error('获取用户SPU报价列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取报价列表失败'
    });
  }
});

/**
 * 获取用户的单个报价详情
 * GET /api/quotes/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const pool = await getConnection();
    
    // 获取用户的dxm_client_id
    const [userRows] = await pool.execute(
      'SELECT dxm_client_id FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0 || !userRows[0].dxm_client_id) {
      return res.status(404).json({
        success: false,
        message: '用户不存在或未分配客户ID'
      });
    }
    
    const dxmClientId = userRows[0].dxm_client_id;
    
    const [rows] = await pool.execute(`
      SELECT 
        sp.*,
        s.name as spu_name,
        s.photo as spu_photo,
        s.logistics_methods,
        s.weight,
        c.name as country_name,
        c.name_cn as country_name_cn
      FROM spu_prices sp
      LEFT JOIN spus s ON sp.spu = s.spu
      LEFT JOIN countries c ON sp.country_code = c.code
      WHERE sp.id = ? AND sp.dxm_client_id = ?
    `, [id, dxmClientId]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '报价不存在或无权限查看'
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
    
  } catch (error) {
    console.error('获取报价详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取报价详情失败'
    });
  }
});

/**
 * 获取用户的SPU产品列表（有报价的SPU）
 * GET /api/quotes/spus/list
 */
router.get('/spus/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getConnection();
    
    // 获取用户的dxm_client_id
    const [userRows] = await pool.execute(
      'SELECT dxm_client_id FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0 || !userRows[0].dxm_client_id) {
      return res.status(404).json({
        success: false,
        message: '用户不存在或未分配客户ID'
      });
    }
    
    const dxmClientId = userRows[0].dxm_client_id;
    
    // 获取该用户有报价的SPU列表
    const [spus] = await pool.execute(`
      SELECT DISTINCT
        s.spu,
        s.name as spu_name,
        s.photo as spu_photo,
        s.logistics_methods,
        s.weight,
        COUNT(sp.id) as quote_count,
        MIN(sp.total_price) as min_price,
        MAX(sp.total_price) as max_price
      FROM spus s
      INNER JOIN spu_prices sp ON s.spu = sp.spu
      WHERE sp.dxm_client_id = ?
      GROUP BY s.spu, s.name, s.photo, s.logistics_methods, s.weight
      ORDER BY s.name
    `, [dxmClientId]);
    
    res.json({
      success: true,
      data: spus
    });
    
  } catch (error) {
    console.error('获取用户SPU列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取SPU列表失败'
    });
  }
});

/**
 * 获取用户的国家列表（有报价的国家）
 * GET /api/quotes/countries/list
 */
router.get('/countries/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getConnection();
    
    // 获取用户的dxm_client_id
    const [userRows] = await pool.execute(
      'SELECT dxm_client_id FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0 || !userRows[0].dxm_client_id) {
      return res.status(404).json({
        success: false,
        message: '用户不存在或未分配客户ID'
      });
    }
    
    const dxmClientId = userRows[0].dxm_client_id;
    
    // 获取该用户有报价的国家列表
    const [countries] = await pool.execute(`
      SELECT DISTINCT
        c.code,
        c.name,
        c.name_cn,
        COUNT(sp.id) as quote_count
      FROM countries c
      INNER JOIN spu_prices sp ON c.code = sp.country_code
      WHERE sp.dxm_client_id = ?
      GROUP BY c.code, c.name, c.name_cn
      ORDER BY c.name
    `, [dxmClientId]);
    
    res.json({
      success: true,
      data: countries
    });
    
  } catch (error) {
    console.error('获取用户国家列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取国家列表失败'
    });
  }
});

/**
 * 获取用户的报价统计信息
 * GET /api/quotes/stats
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getConnection();
    
    // 获取用户的dxm_client_id
    const [userRows] = await pool.execute(
      'SELECT dxm_client_id FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0 || !userRows[0].dxm_client_id) {
      return res.status(404).json({
        success: false,
        message: '用户不存在或未分配客户ID'
      });
    }
    
    const dxmClientId = userRows[0].dxm_client_id;
    
    // 获取统计信息
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_quotes,
        COUNT(DISTINCT spu) as total_spus,
        COUNT(DISTINCT country_code) as total_countries,
        MIN(total_price) as min_price,
        MAX(total_price) as max_price,
        AVG(total_price) as avg_price
      FROM spu_prices
      WHERE dxm_client_id = ?
    `, [dxmClientId]);
    
    res.json({
      success: true,
      data: stats[0]
    });
    
  } catch (error) {
    console.error('获取用户报价统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败'
    });
  }
});

module.exports = router;
