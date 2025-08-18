const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/adminAuth');
const { getConnection } = require('../config/database');
const { recordPriceHistory } = require('./spu-price-history');

// 获取SPU报价列表
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { 
      page = 1, 
      limit = 20, 
      spu = '', 
      dxm_client_id = '',
      country_code = '', 
      quantity = ''
    } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    // 搜索条件
    if (spu) {
      whereClause += ' AND sp.spu = ?';
      params.push(spu);
    }
    
    if (dxm_client_id) {
      whereClause += ' AND sp.dxm_client_id = ?';
      params.push(dxm_client_id);
    }
    
    if (country_code) {
      whereClause += ' AND sp.country_code = ?';
      params.push(country_code);
    }
    
    if (quantity) {
      whereClause += ' AND sp.quantity = ?';
      params.push(parseInt(quantity));
    }
    
    // 获取报价列表
    const [quotes] = await pool.execute(`
      SELECT 
        sp.*,
        s.name as spu_name,
        c.name as country_name,
        c.name_cn as country_name_cn
      FROM spu_prices sp
      LEFT JOIN spus s ON sp.spu = s.spu
      LEFT JOIN countries c ON sp.country_code = c.code
      ${whereClause}
      ORDER BY sp.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
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
    console.error('获取SPU报价列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取SPU报价列表失败'
    });
  }
});

// 获取单个报价详情
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { id } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT 
        sp.*,
        s.name as spu_name,
        c.name as country_name,
        c.name_cn as country_name_cn
      FROM spu_prices sp
      LEFT JOIN spus s ON sp.spu = s.spu
      LEFT JOIN countries c ON sp.country_code = c.code
      WHERE sp.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '报价不存在'
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

// 创建报价
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { 
      spu, 
      dxm_client_id,
      country_code, 
      product_cost, 
      shipping_cost, 
      packing_cost, 
      vat_cost, 
      quantity = 1,
      total_price 
    } = req.body;
    
    // 验证必需字段
    if (!spu || !dxm_client_id || !country_code || product_cost === undefined || shipping_cost === undefined || 
        packing_cost === undefined || vat_cost === undefined) {
      return res.status(400).json({
        success: false,
        message: 'SPU、客户ID、国家代码和各项成本为必填项'
      });
    }
    
    // 验证数值
    const costs = [product_cost, shipping_cost, packing_cost, vat_cost];
    if (costs.some(cost => isNaN(cost) || cost < 0)) {
      return res.status(400).json({
        success: false,
        message: '成本必须为非负数'
      });
    }
    
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '数量必须为正整数'
      });
    }
    
    // 检查SPU是否存在
    const [spuRows] = await pool.execute('SELECT spu FROM spus WHERE spu = ?', [spu]);
    if (spuRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'SPU不存在'
      });
    }
    
    // 计算总价（如果没有提供）
    const calculatedTotal = parseFloat(product_cost) + parseFloat(shipping_cost) + 
                           parseFloat(packing_cost) + parseFloat(vat_cost);
    const finalTotalPrice = total_price !== undefined ? parseFloat(total_price) : calculatedTotal;
    
    try {
      // 插入报价
      const [result] = await pool.execute(`
        INSERT INTO spu_prices (
          spu, dxm_client_id, country_code, product_cost, shipping_cost, 
          packing_cost, vat_cost, quantity, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [spu, dxm_client_id, country_code, product_cost, shipping_cost, packing_cost, vat_cost, quantity, finalTotalPrice]);
      
      // 记录价格变更历史
      await recordPriceHistory(pool, {
        spu,
        country_code,
        quantity,
        oldPrice: null,
        newPrice: {
          product_cost,
          shipping_cost,
          packing_cost,
          vat_cost,
          total_price: finalTotalPrice
        },
        change_type: 'create',
        change_reason: '创建新报价',
        admin_id: req.admin?.id,
        admin_name: req.admin?.username || 'Unknown'
      });
      
      res.json({
        success: true,
        message: '报价创建成功',
        data: { id: result.insertId }
      });
      
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({
          success: false,
          message: `该客户(${dxm_client_id})的SPU(${spu})在国家(${country_code})数量(${quantity})的报价已存在，请检查四要素组合的唯一性`
        });
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('创建报价失败:', error);
    res.status(500).json({
      success: false,
      message: '创建报价失败'
    });
  }
});

// 更新报价
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { id } = req.params;
    const { 
      product_cost, 
      shipping_cost, 
      packing_cost, 
      vat_cost, 
      quantity = 1,
      total_price 
    } = req.body;
    
    // 验证必需字段
    if (product_cost === undefined || shipping_cost === undefined || 
        packing_cost === undefined || vat_cost === undefined) {
      return res.status(400).json({
        success: false,
        message: '各项成本为必填项'
      });
    }
    
    // 验证数值
    const costs = [product_cost, shipping_cost, packing_cost, vat_cost];
    if (costs.some(cost => isNaN(cost) || cost < 0)) {
      return res.status(400).json({
        success: false,
        message: '成本必须为非负数'
      });
    }
    
    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '数量必须为正整数'
      });
    }
    
    // 检查报价是否存在并获取旧数据
    const [existingRows] = await pool.execute(`
      SELECT * FROM spu_prices WHERE id = ?
    `, [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '报价不存在'
      });
    }
    
    const oldPrice = existingRows[0];
    
    // 计算总价（如果没有提供）
    const calculatedTotal = parseFloat(product_cost) + parseFloat(shipping_cost) + 
                           parseFloat(packing_cost) + parseFloat(vat_cost);
    const finalTotalPrice = total_price !== undefined ? parseFloat(total_price) : calculatedTotal;
    
    // 更新报价
    await pool.execute(`
      UPDATE spu_prices 
      SET product_cost = ?, shipping_cost = ?, packing_cost = ?, 
          vat_cost = ?, quantity = ?, total_price = ?
      WHERE id = ?
    `, [product_cost, shipping_cost, packing_cost, vat_cost, quantity, finalTotalPrice, id]);
    
    // 记录价格变更历史
    await recordPriceHistory(pool, {
      spu: oldPrice.spu,
      country_code: oldPrice.country_code,
      quantity: oldPrice.quantity,
      oldPrice: {
        product_cost: oldPrice.product_cost,
        shipping_cost: oldPrice.shipping_cost,
        packing_cost: oldPrice.packing_cost,
        vat_cost: oldPrice.vat_cost,
        total_price: oldPrice.total_price
      },
      newPrice: {
        product_cost,
        shipping_cost,
        packing_cost,
        vat_cost,
        total_price: finalTotalPrice
      },
      change_type: 'update',
      change_reason: '更新报价',
      admin_id: req.admin?.id,
      admin_name: req.admin?.username || 'Unknown'
    });
    
    res.json({
      success: true,
      message: '报价更新成功'
    });
    
  } catch (error) {
    console.error('更新报价失败:', error);
    res.status(500).json({
      success: false,
      message: '更新报价失败'
    });
  }
});

// 删除报价
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { id } = req.params;
    
    // 获取要删除的报价信息
    const [existingRows] = await pool.execute('SELECT * FROM spu_prices WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '报价不存在'
      });
    }
    
    const oldPrice = existingRows[0];
    
    // 删除报价
    const [result] = await pool.execute('DELETE FROM spu_prices WHERE id = ?', [id]);
    
    // 记录价格变更历史
    await recordPriceHistory(pool, {
      spu: oldPrice.spu,
      country_code: oldPrice.country_code,
      quantity: oldPrice.quantity,
      oldPrice: {
        product_cost: oldPrice.product_cost,
        shipping_cost: oldPrice.shipping_cost,
        packing_cost: oldPrice.packing_cost,
        vat_cost: oldPrice.vat_cost,
        total_price: oldPrice.total_price
      },
      newPrice: {
        product_cost: 0,
        shipping_cost: 0,
        packing_cost: 0,
        vat_cost: 0,
        total_price: 0
      },
      change_type: 'delete',
      change_reason: '删除报价',
      admin_id: req.admin?.id,
      admin_name: req.admin?.username || 'Unknown'
    });
    
    res.json({
      success: true,
      message: '报价删除成功'
    });
    
  } catch (error) {
    console.error('删除报价失败:', error);
    res.status(500).json({
      success: false,
      message: '删除报价失败'
    });
  }
});

// 批量创建报价
router.post('/batch', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { quotes } = req.body;
    
    if (!Array.isArray(quotes) || quotes.length === 0) {
      return res.status(400).json({
        success: false,
        message: '报价数据不能为空'
      });
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    // 开始事务
    await pool.execute('START TRANSACTION');
    
    try {
      for (let i = 0; i < quotes.length; i++) {
        const quote = quotes[i];
        const { 
          spu, 
          dxm_client_id,
          country_code, 
          product_cost, 
          shipping_cost, 
          packing_cost, 
          vat_cost, 
          quantity = 1,
          total_price 
        } = quote;
        
        try {
          // 验证必需字段
          if (!spu || !dxm_client_id || !country_code || product_cost === undefined || 
              shipping_cost === undefined || packing_cost === undefined || 
              vat_cost === undefined) {
            throw new Error('缺少必需字段');
          }
          
          // 检查SPU是否存在
          const [spuRows] = await pool.execute('SELECT spu FROM spus WHERE spu = ?', [spu]);
          if (spuRows.length === 0) {
            throw new Error('SPU不存在');
          }
          
          // 计算总价
          const calculatedTotal = parseFloat(product_cost) + parseFloat(shipping_cost) + 
                                 parseFloat(packing_cost) + parseFloat(vat_cost);
          const finalTotalPrice = total_price !== undefined ? parseFloat(total_price) : calculatedTotal;
          
          // 插入报价
          await pool.execute(`
            INSERT INTO spu_prices (
              spu, dxm_client_id, country_code, product_cost, shipping_cost, 
              packing_cost, vat_cost, quantity, total_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              product_cost = VALUES(product_cost),
              shipping_cost = VALUES(shipping_cost),
              packing_cost = VALUES(packing_cost),
              vat_cost = VALUES(vat_cost),
              total_price = VALUES(total_price)
          `, [spu, dxm_client_id, country_code, product_cost, shipping_cost, packing_cost, vat_cost, quantity, finalTotalPrice]);
          
          results.success++;
          
        } catch (error) {
          results.failed++;
          results.errors.push({
            index: i,
            data: quote,
            error: error.message
          });
        }
      }
      
      await pool.execute('COMMIT');
      
      res.json({
        success: true,
        message: `批量操作完成：成功 ${results.success} 条，失败 ${results.failed} 条`,
        data: results
      });
      
    } catch (error) {
      await pool.execute('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('批量创建报价失败:', error);
    res.status(500).json({
      success: false,
      message: '批量创建报价失败'
    });
  }
});

// 批量删除报价
router.delete('/batch', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ID列表不能为空'
      });
    }
    
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(`
      DELETE FROM spu_prices WHERE id IN (${placeholders})
    `, ids);
    
    res.json({
      success: true,
      message: `成功删除 ${result.affectedRows} 条报价`
    });
    
  } catch (error) {
    console.error('批量删除报价失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除报价失败'
    });
  }
});

// 获取国家列表
router.get('/countries/list', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    
    const [countries] = await pool.execute(`
      SELECT code, name, name_cn, is_active
      FROM countries
      WHERE is_active = TRUE
      ORDER BY sort_order, name
    `);
    
    res.json({
      success: true,
      data: countries
    });
    
  } catch (error) {
    console.error('获取国家列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取国家列表失败'
    });
  }
});

module.exports = router;
