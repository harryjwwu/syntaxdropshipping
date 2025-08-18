const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/adminAuth');
const { getConnection } = require('../config/database');

// 获取SPU列表
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { page = 1, limit = 20, search = '', parent_spu } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    // 搜索条件
    if (search) {
      whereClause += ' AND (s.spu LIKE ? OR s.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // 父SPU筛选
    if (parent_spu) {
      whereClause += ' AND s.parent_spu = ?';
      params.push(parent_spu);
    }
    
    // 获取SPU列表和关联的SKU
    const [spus] = await pool.execute(`
      SELECT 
        s.*,
        ps.name as parent_spu_name,
        GROUP_CONCAT(DISTINCT ssr.sku ORDER BY ssr.sku SEPARATOR ',') as skus
      FROM spus s
      LEFT JOIN spus ps ON s.parent_spu = ps.spu
      LEFT JOIN sku_spu_relations ssr ON s.spu = ssr.spu
      ${whereClause}
      GROUP BY s.spu
      ORDER BY s.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `.replace(/\$\{parseInt\(limit\)\}/g, parseInt(limit)).replace(/\$\{parseInt\(offset\)\}/g, parseInt(offset)), [...params]);
    
    // 获取总数
    const [countResult] = await pool.execute(`
      SELECT COUNT(DISTINCT s.spu) as total
      FROM spus s
      ${whereClause}
    `, params);
    
    const total = countResult[0].total;
    const pages = Math.ceil(total / limit);
    
    // 处理SKU字段
    const processedSpus = spus.map(spu => ({
      ...spu,
      skus: spu.skus ? spu.skus.split(',') : []
    }));
    
    res.json({
      success: true,
      data: processedSpus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    });
    
  } catch (error) {
    console.error('获取SPU列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取SPU列表失败'
    });
  }
});

// 获取单个SPU详情
router.get('/:spu', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { spu } = req.params;
    
    // 获取SPU基本信息
    const [spuRows] = await pool.execute(`
      SELECT 
        s.*,
        ps.name as parent_spu_name
      FROM spus s
      LEFT JOIN spus ps ON s.parent_spu = ps.spu
      WHERE s.spu = ?
    `, [spu]);
    
    if (spuRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'SPU不存在'
      });
    }
    
    // 获取关联的SKU
    const [skuRows] = await pool.execute(`
      SELECT sku, created_at
      FROM sku_spu_relations
      WHERE spu = ?
      ORDER BY created_at DESC
    `, [spu]);
    
    const spuData = {
      ...spuRows[0],
      skus: skuRows.map(row => row.sku)
    };
    
    res.json({
      success: true,
      data: spuData
    });
    
  } catch (error) {
    console.error('获取SPU详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取SPU详情失败'
    });
  }
});

// 创建SPU
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { spu, name, photo, logistics_methods, weight, parent_spu, skus = [] } = req.body;
    
    // 验证必需字段
    if (!spu || !name) {
      return res.status(400).json({
        success: false,
        message: 'SPU编号和名称为必填项'
      });
    }
    
    // 检查SPU是否已存在
    const [existingRows] = await pool.execute('SELECT spu FROM spus WHERE spu = ?', [spu]);
    if (existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'SPU编号已存在'
      });
    }
    
    // 验证parent_spu是否存在（如果提供了且不等于自身）
    if (parent_spu && parent_spu !== spu) {
      const [parentRows] = await pool.execute('SELECT spu FROM spus WHERE spu = ?', [parent_spu]);
      if (parentRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: '父SPU不存在'
        });
      }
    }
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 插入SPU
      await connection.execute(`
        INSERT INTO spus (spu, name, photo, logistics_methods, weight, parent_spu)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [spu, name, photo || null, logistics_methods || null, weight || null, parent_spu || spu]);
      
      // 插入SKU关联
      if (skus && skus.length > 0) {
        for (const sku of skus) {
          if (sku.trim()) {
            await connection.execute(`
              INSERT IGNORE INTO sku_spu_relations (sku, spu)
              VALUES (?, ?)
            `, [sku.trim(), spu]);
          }
        }
      }
      
      await connection.commit();
      connection.release();
      
      res.json({
        success: true,
        message: 'SPU创建成功',
        data: { spu }
      });
      
    } catch (error) {
      await pool.execute('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('创建SPU失败:', error);
    res.status(500).json({
      success: false,
      message: '创建SPU失败'
    });
  }
});

// 更新SPU
router.put('/:spu', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔄 开始更新SPU:', req.params.spu);
    console.log('📋 更新数据:', req.body);
    
    const pool = await getConnection();
    const { spu } = req.params;
    const { name, photo, logistics_methods, weight, parent_spu, skus = [] } = req.body;
    
    // 验证必需字段
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '名称为必填项'
      });
    }
    
    // 检查SPU是否存在
    const [existingRows] = await pool.execute('SELECT spu FROM spus WHERE spu = ?', [spu]);
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'SPU不存在'
      });
    }
    
    // 验证parent_spu是否存在（如果提供了且不等于自身）
    if (parent_spu && parent_spu !== spu) {
      const [parentRows] = await pool.execute('SELECT spu FROM spus WHERE spu = ?', [parent_spu]);
      if (parentRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: '父SPU不存在'
        });
      }
    }
    
    // 获取连接并开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 更新SPU
      await connection.execute(`
        UPDATE spus 
        SET name = ?, photo = ?, logistics_methods = ?, weight = ?, parent_spu = ?
        WHERE spu = ?
      `, [name, photo || null, logistics_methods || null, weight || null, parent_spu || spu, spu]);
      
      // 删除现有SKU关联
      await connection.execute('DELETE FROM sku_spu_relations WHERE spu = ?', [spu]);
      
      // 插入新的SKU关联
      if (skus && skus.length > 0) {
        for (const sku of skus) {
          if (sku.trim()) {
            await connection.execute(`
              INSERT INTO sku_spu_relations (sku, spu)
              VALUES (?, ?)
            `, [sku.trim(), spu]);
          }
        }
      }
      
      await connection.commit();
      connection.release();
      
      res.json({
        success: true,
        message: 'SPU更新成功'
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('更新SPU失败:', error);
    res.status(500).json({
      success: false,
      message: '更新SPU失败'
    });
  }
});

// 删除SPU
router.delete('/:spu', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { spu } = req.params;
    
    // 检查SPU是否存在
    const [existingRows] = await pool.execute('SELECT spu FROM spus WHERE spu = ?', [spu]);
    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'SPU不存在'
      });
    }
    
    // 检查是否有子SPU
    const [childRows] = await pool.execute('SELECT spu FROM spus WHERE parent_spu = ? AND spu != ?', [spu, spu]);
    if (childRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '该SPU存在子SPU，无法删除'
      });
    }
    
    // 删除SPU（级联删除SKU关联和价格）
    await pool.execute('DELETE FROM spus WHERE spu = ?', [spu]);
    
    res.json({
      success: true,
      message: 'SPU删除成功'
    });
    
  } catch (error) {
    console.error('删除SPU失败:', error);
    res.status(500).json({
      success: false,
      message: '删除SPU失败'
    });
  }
});

// 为SPU添加SKU
router.post('/:spu/skus', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { spu } = req.params;
    const { sku } = req.body;
    
    if (!sku || !sku.trim()) {
      return res.status(400).json({
        success: false,
        message: 'SKU不能为空'
      });
    }
    
    // 检查SPU是否存在
    const [spuRows] = await pool.execute('SELECT spu FROM spus WHERE spu = ?', [spu]);
    if (spuRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'SPU不存在'
      });
    }
    
    // 添加SKU关联
    try {
      await pool.execute(`
        INSERT INTO sku_spu_relations (sku, spu)
        VALUES (?, ?)
      `, [sku.trim(), spu]);
      
      res.json({
        success: true,
        message: 'SKU添加成功'
      });
      
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({
          success: false,
          message: 'SKU已存在'
        });
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('添加SKU失败:', error);
    res.status(500).json({
      success: false,
      message: '添加SKU失败'
    });
  }
});

// 删除SPU下的SKU
router.delete('/:spu/skus/:sku', authenticateAdmin, async (req, res) => {
  try {
    const pool = await getConnection();
    const { spu, sku } = req.params;
    
    // 删除SKU关联
    const [result] = await pool.execute(`
      DELETE FROM sku_spu_relations 
      WHERE spu = ? AND sku = ?
    `, [spu, sku]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'SKU关联不存在'
      });
    }
    
    res.json({
      success: true,
      message: 'SKU删除成功'
    });
    
  } catch (error) {
    console.error('删除SKU失败:', error);
    res.status(500).json({
      success: false,
      message: '删除SKU失败'
    });
  }
});

module.exports = router;
