const express = require('express');
const multer = require('multer');
const { authenticateAdmin } = require('../middleware/adminAuth');
const orderShardingManager = require('../utils/orderShardingManager');
const OrderExcelParser = require('../utils/orderExcelParser');
const { checkLimits } = require('../config/orderLimits');

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // 只允许Excel文件
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传Excel文件(.xlsx, .xls)'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// 初始化分表管理器
orderShardingManager.init();

/**
 * 上传并导入订单Excel文件
 */
router.post('/import', authenticateAdmin, upload.single('file'), async (req, res) => {
  try {
    console.log('📤 开始处理订单Excel导入...');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的Excel文件'
      });
    }

    console.log(`📋 文件信息: ${req.file.originalname}, 大小: ${req.file.size} bytes`);

    // 解析Excel文件
    const parser = new OrderExcelParser();
    const parseResult = parser.parseExcel(req.file.buffer);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Excel文件解析失败',
        error: parseResult.error
      });
    }

    console.log(`📊 解析结果: 总共${parseResult.total}行, 成功${parseResult.parsed}行, 失败${parseResult.failed}行`);

    // 检查处理限制
    const limitCheck = checkLimits(parseResult.parsed, req.file.size);
    if (!limitCheck.canProcess) {
      return res.status(400).json({
        success: false,
        message: '数据量超出处理限制',
        errors: limitCheck.errors,
        warnings: limitCheck.warnings
      });
    }

    // 显示警告信息
    if (limitCheck.warnings.length > 0) {
      console.log('⚠️ 处理警告:');
      limitCheck.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    console.log(`🔧 建议批次大小: ${limitCheck.recommendedBatchSize}条`);
    console.log(`⏱️ 预计处理时间: ${limitCheck.estimatedTime}秒`);
    console.log(`💾 预计内存使用: ${(limitCheck.estimatedMemory/1024/1024).toFixed(1)}MB`);

    // 验证订单数据
    const validationResult = parser.validateOrders(parseResult.orders);
    console.log(`✅ 数据验证: 有效${validationResult.validCount}条, 无效${validationResult.invalidCount}条`);

    // 准备所有订单数据（包括验证失败的）
    const allOrdersForProcessing = [
      ...validationResult.valid,  // 验证通过的订单
      ...validationResult.invalid.map(invalid => ({
        ...invalid.order,
        _validationFailed: true,
        _validationErrors: invalid.errors
      })) // 验证失败的订单，标记为验证失败
    ];

    console.log(`💾 开始处理 ${allOrdersForProcessing.length} 条订单数据（包含 ${validationResult.invalidCount} 条验证失败的订单）...`);

    // 批量插入订单数据（包括异常订单）
    const insertResult = await orderShardingManager.batchInsertOrders(allOrdersForProcessing);
    console.log(`💾 数据处理结果: 正常${insertResult.success}条, 异常${insertResult.abnormal}条, 失败${insertResult.failed}条`);
    
    // 输出结算统计信息
    if (insertResult.settlementStats) {
      const stats = insertResult.settlementStats;
      console.log(`⚖️ 结算统计: 总计${stats.totalProcessed}条, 取消结算${stats.cancelCount}条, 等待结算${stats.waitingCount}条`);
      if (stats.cancelCount > 0) {
        console.log(`📋 取消原因分布: 已退款${stats.cancelReasons['已退款']}条, 备注不结算${stats.cancelReasons['备注不结算']}条, Upsell产品${stats.cancelReasons['Upsell产品']}条`);
      }
    }
    
    // 输出SKU为空订单统计
    if (insertResult.emptySkuStats && insertResult.emptySkuStats.count > 0) {
      console.log(`🚨 SKU为空订单: ${insertResult.emptySkuStats.count}条订单未保存，请绑定商品后重新导入`);
    }

    res.json({
      success: true,
      message: '订单导入完成',
      data: {
        parseResult: {
          total: parseResult.total,
          parsed: parseResult.parsed,
          failed: parseResult.failed
        },
        validationResult: {
          validCount: validationResult.validCount,
          invalidCount: validationResult.invalidCount,
          invalid: validationResult.invalid // 返回验证失败的详细信息
        },
        insertResult: {
          success: insertResult.success,
          failed: insertResult.failed,
          abnormal: insertResult.abnormal || 0,
          errors: insertResult.errors.slice(0, 10) // 只返回前10个错误
        },
        // 新增结算统计
        settlementResult: {
          totalProcessed: insertResult.settlementStats?.totalProcessed || 0,
          cancelCount: insertResult.settlementStats?.cancelCount || 0,
          waitingCount: insertResult.settlementStats?.waitingCount || 0,
          cancelBreakdown: insertResult.settlementStats?.cancelReasons || {}
        },
        // 新增SKU为空订单统计
        emptySkuResult: {
          count: insertResult.emptySkuStats?.count || 0,
          orders: insertResult.emptySkuStats?.orders || []
        }
      }
    });

  } catch (error) {
    console.error('❌ 订单导入失败:', error);
    res.status(500).json({
      success: false,
      message: '订单导入失败',
      error: error.message
    });
  }
});

/**
 * 根据客户ID查询订单列表
 */
router.get('/client/:clientId', authenticateAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;
    const {
      page = 1,
      limit = 50,
      status = null,
      settlementStatus = null,
      buyerName = null,
      paymentTimeStart = null,
      paymentTimeEnd = null,
      orderBy = 'created_at',
      orderDirection = 'DESC'
    } = req.query;

    const dxmClientId = parseInt(clientId);
    if (isNaN(dxmClientId)) {
      return res.status(400).json({
        success: false,
        message: '无效的客户ID'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);



    const result = await orderShardingManager.getOrdersByClientId(dxmClientId, {
      limit: parseInt(limit),
      offset: offset,
      status: status,
      settlementStatus: settlementStatus,
      buyerName: buyerName,
      paymentTimeStart: paymentTimeStart,
      paymentTimeEnd: paymentTimeEnd,
      orderBy: orderBy,
      orderDirection: orderDirection.toUpperCase()
    });

    // 获取统计信息
    const stats = await orderShardingManager.getOrderStats(dxmClientId);

    res.json({
      success: true,
      data: {
        orders: result.orders,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages,
          hasNext: result.page < result.pages,
          hasPrev: result.page > 1
        },
        stats: stats
      }
    });

  } catch (error) {
    console.error('❌ 查询订单失败:', error);
    res.status(500).json({
      success: false,
      message: '查询订单失败',
      error: error.message
    });
  }
});

/**
 * 根据订单号查询订单详情
 */
router.get('/order/:orderId', authenticateAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !orderId.includes('-')) {
      return res.status(400).json({
        success: false,
        message: '无效的订单号格式'
      });
    }

    const orders = await orderShardingManager.getOrdersByOrderId(orderId);

    res.json({
      success: true,
      data: {
        orders: orders,
        count: orders.length
      }
    });

  } catch (error) {
    console.error('❌ 查询订单详情失败:', error);
    res.status(500).json({
      success: false,
      message: '查询订单详情失败',
      error: error.message
    });
  }
});

/**
 * 更新订单信息
 */
router.put('/order/:orderId', authenticateAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const updateData = req.body;

    if (!orderId || !orderId.includes('-')) {
      return res.status(400).json({
        success: false,
        message: '无效的订单号格式'
      });
    }

    // 过滤允许更新的字段
    const allowedFields = [
      'order_status', 'settlement_status', 'settle_remark',
      'waybill_number', 'remark', 'unit_price', 'multi_total_price',
      'discount', 'settlement_amount'
    ];

    const filteredData = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        filteredData[key] = value;
      }
    }

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有有效的更新字段'
      });
    }

    const result = await orderShardingManager.updateOrder(orderId, filteredData);

    if (result.success) {
      res.json({
        success: true,
        message: '订单更新成功',
        data: {
          affectedRows: result.affectedRows
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: '订单不存在或更新失败'
      });
    }

  } catch (error) {
    console.error('❌ 更新订单失败:', error);
    res.status(500).json({
      success: false,
      message: '更新订单失败',
      error: error.message
    });
  }
});

/**
 * 获取客户订单统计
 */
router.get('/stats/:clientId', authenticateAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;
    const dxmClientId = parseInt(clientId);
    
    if (isNaN(dxmClientId)) {
      return res.status(400).json({
        success: false,
        message: '无效的客户ID'
      });
    }

    const stats = await orderShardingManager.getOrderStats(dxmClientId);

    // 处理统计数据
    const processedStats = {
      totalOrders: 0,
      uniqueOrders: 0,
      totalProducts: 0,
      totalSettlement: 0,
      statusBreakdown: {},
      settlementBreakdown: {}
    };

    stats.forEach(stat => {
      processedStats.totalOrders += stat.status_count;
      
      if (!processedStats.statusBreakdown[stat.order_status]) {
        processedStats.statusBreakdown[stat.order_status] = 0;
      }
      processedStats.statusBreakdown[stat.order_status] += stat.status_count;
      
      if (!processedStats.settlementBreakdown[stat.settlement_status]) {
        processedStats.settlementBreakdown[stat.settlement_status] = 0;
      }
      processedStats.settlementBreakdown[stat.settlement_status] += stat.status_count;
      
      processedStats.totalProducts += stat.total_products || 0;
      processedStats.totalSettlement += parseFloat(stat.total_settlement || 0);
    });

    res.json({
      success: true,
      data: processedStats
    });

  } catch (error) {
    console.error('❌ 获取订单统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单统计失败',
      error: error.message
    });
  }
});

/**
 * 测试订单Excel解析（不保存到数据库）
 */
router.post('/test-parse', authenticateAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的Excel文件'
      });
    }

    // 只解析不保存
    const parser = new OrderExcelParser();
    const parseResult = parser.parseExcel(req.file.buffer);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Excel文件解析失败',
        error: parseResult.error
      });
    }

    // 验证数据
    const validationResult = parser.validateOrders(parseResult.orders);

    res.json({
      success: true,
      message: 'Excel解析测试完成',
      data: {
        parseResult: parseResult,
        validationResult: validationResult,
        sampleOrders: parseResult.orders.slice(0, 5) // 返回前5条作为样例
      }
    });

  } catch (error) {
    console.error('❌ 测试解析失败:', error);
    res.status(500).json({
      success: false,
      message: '测试解析失败',
      error: error.message
    });
  }
});

/**
 * 获取异常订单列表
 */
router.get('/abnormal', authenticateAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status = null
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { getConnection } = require('../config/database');
    const connection = await getConnection();

    let sql = 'SELECT * FROM order_abnormal WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND order_status = ?';
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [orders] = await connection.execute(sql, params);

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM order_abnormal WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countSql += ' AND order_status = ?';
      countParams.push(status);
    }

    const [countResult] = await connection.execute(countSql, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        orders: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('❌ 查询异常订单失败:', error);
    res.status(500).json({
      success: false,
      message: '查询异常订单失败',
      error: error.message
    });
  }
});

/**
 * 获取分表信息
 */
router.get('/sharding-info', authenticateAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        tableCount: orderShardingManager.tableCount,
        tablePrefix: orderShardingManager.tablePrefix,
        getTableName: (clientId) => orderShardingManager.getTableName(parseInt(clientId))
      }
    });
  } catch (error) {
    console.error('❌ 获取分表信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分表信息失败',
      error: error.message
    });
  }
});

module.exports = router;


