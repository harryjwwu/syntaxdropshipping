const express = require('express');
const router = express.Router();
const { authenticateToken: auth, requireAdmin } = require('../middleware/auth');
const { getConnection } = require('../config/database');
const commissionManager = require('../utils/commissionManager');

// 生成订单号
function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SYN${timestamp}${random}`;
}

// 创建订单
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      items,           // 订单商品列表 [{ productId, quantity, price }]
      shippingAddress, // 收货地址
      billingAddress,  // 账单地址
      notes           // 订单备注
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    const db = await getConnection();

    // 开始事务
    await db.query('START TRANSACTION');

    try {
      // 验证所有商品
      let totalAmount = 0;
      const validatedItems = [];

      for (const item of items) {
        const [product] = await db.execute(
          'SELECT * FROM products WHERE id = ? AND in_stock = 1',
          [item.productId]
        );

        if (product.length === 0) {
          throw new Error(`Product ${item.productId} not found or out of stock`);
        }

        const productData = product[0];
        const itemTotal = parseFloat(productData.price) * parseInt(item.quantity);
        
        validatedItems.push({
          productId: item.productId,
          productName: productData.name,
          quantity: parseInt(item.quantity),
          price: parseFloat(productData.price),
          total: itemTotal
        });

        totalAmount += itemTotal;
      }

      // 生成订单号
      const orderNumber = generateOrderNumber();

      // 创建订单
      const [orderResult] = await db.execute(
        `INSERT INTO orders (user_id, order_number, status, total_amount, currency, 
         shipping_address, billing_address, notes) 
         VALUES (?, ?, 'pending', ?, 'USD', ?, ?, ?)`,
        [
          userId,
          orderNumber,
          totalAmount,
          JSON.stringify(shippingAddress),
          JSON.stringify(billingAddress || shippingAddress),
          notes || ''
        ]
      );

      const orderId = orderResult.insertId;

      // 添加订单商品
      for (const item of validatedItems) {
        await db.execute(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, price, total) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.productId, item.productName, item.quantity, item.price, item.total]
        );
      }

      await db.query('COMMIT');

      // 返回订单信息
      const [newOrder] = await db.execute(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order: newOrder[0],
          items: validatedItems
        }
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
});

// 获取用户订单列表
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const db = await getConnection();

    const [orders] = await db.execute(
      `SELECT o.*, COUNT(oi.id) as item_count 
       FROM orders o 
       LEFT JOIN order_items oi ON o.id = oi.order_id 
       WHERE o.user_id = ? 
       GROUP BY o.id 
       ORDER BY o.created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [totalCount] = await db.execute(
      'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total: totalCount[0].total,
          pages: Math.ceil(totalCount[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// 获取订单详情
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const db = await getConnection();

    // 获取订单信息
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // 获取订单商品
    const [items] = await db.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );

    res.json({
      success: true,
      data: {
        order: orders[0],
        items
      }
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

// 取消订单
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const db = await getConnection();

    // 检查订单是否存在且属于当前用户
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    // 只有pending和processing状态的订单可以取消
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled'
      });
    }

    // 更新订单状态
    await db.execute(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['cancelled', orderId]
    );

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
});

// 管理员：获取所有订单
router.get('/admin/all', [auth, requireAdmin], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    const db = await getConnection();

    let query = `
      SELECT o.*, u.name as user_name, u.email as user_email,
             COUNT(oi.id) as item_count
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    
    let queryParams = [];
    
    if (status) {
      query += ' WHERE o.status = ?';
      queryParams.push(status);
    }
    
    query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [orders] = await db.execute(query, queryParams);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM orders';
    let countParams = [];
    
    if (status) {
      countQuery += ' WHERE status = ?';
      countParams.push(status);
    }
    
    const [totalCount] = await db.execute(countQuery, countParams);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total: totalCount[0].total,
          pages: Math.ceil(totalCount[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// 管理员：更新订单状态
router.patch('/admin/:id/status', [auth, requireAdmin], async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const db = await getConnection();

    // 获取原订单信息
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    // 开始事务
    await db.query('START TRANSACTION');

    try {
      // 更新订单状态
      await db.execute(
        'UPDATE orders SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, notes || order.notes, orderId]
      );

      // 如果订单状态变为已支付/处理中，触发佣金计算
      if (status === 'processing' && order.status === 'pending') {
        await commissionManager.calculateCommission(orderId, order.user_id, order.total_amount);
      }

      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Order status updated successfully'
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

module.exports = router;