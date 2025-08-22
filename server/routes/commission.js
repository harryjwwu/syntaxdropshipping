const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/adminAuth');
const { getConnection } = require('../config/database');

/**
 * 获取佣金记录列表
 * GET /api/admin/commissions
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = '', 
      search = ''
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;
    const connection = await getConnection();

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];

    if (status) {
      whereConditions.push('cr.status = ?');
      queryParams.push(status);
    }

    if (search) {
      whereConditions.push('(u1.name LIKE ? OR u1.email LIKE ? OR u2.name LIKE ? OR u2.email LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // 获取佣金记录列表
    const query = `
      SELECT 
        cr.*,
        u1.name as referrer_name,
        u1.email as referrer_email,
        u2.name as referee_name,
        u2.email as referee_email,
        u2.dxm_client_id,
        a.name as admin_name
      FROM commission_records cr
      LEFT JOIN users u1 ON cr.referrer_id = u1.id
      LEFT JOIN users u2 ON cr.referee_id = u2.id
      LEFT JOIN admins a ON cr.admin_id = a.id
      ${whereClause}
      ORDER BY cr.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [commissions] = await connection.execute(query, queryParams);

    // 获取总记录数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM commission_records cr
      LEFT JOIN users u1 ON cr.referrer_id = u1.id
      LEFT JOIN users u2 ON cr.referee_id = u2.id
      ${whereClause}
    `;

    const [totalResult] = await connection.execute(countQuery, queryParams);
    const total = totalResult[0].total;

    // 获取统计数据
    const [statsResult] = await connection.execute(`
      SELECT 
        COUNT(*) as total_commissions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_commissions,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_commissions,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_commissions,
        SUM(commission_amount) as total_amount,
        SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'approved' THEN commission_amount ELSE 0 END) as approved_amount
      FROM commission_records
    `);

    res.json({
      success: true,
      data: {
        commissions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        stats: statsResult[0]
      }
    });

  } catch (error) {
    console.error('获取佣金记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取佣金记录失败'
    });
  }
});

/**
 * 审核佣金记录
 * PUT /api/admin/commissions/:id/review
 */
router.put('/:id/review', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reject_reason, notes } = req.body;
    const adminId = req.admin.id;

    // 验证状态
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态，必须是 approved 或 rejected'
      });
    }

    const connection = await getConnection();

    // 检查佣金记录是否存在且为pending状态
    const [existing] = await connection.execute(`
      SELECT cr.*, u1.name as referrer_name, u2.name as referee_name
      FROM commission_records cr
      LEFT JOIN users u1 ON cr.referrer_id = u1.id
      LEFT JOIN users u2 ON cr.referee_id = u2.id
      WHERE cr.id = ? AND cr.status = 'pending'
    `, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '佣金记录不存在或已经审核过'
      });
    }

    const commission = existing[0];

    // 更新佣金记录状态
    const updateFields = [
      'status = ?',
      'admin_id = ?',
      'approved_at = CURRENT_TIMESTAMP',
      'notes = ?',
      'updated_at = CURRENT_TIMESTAMP'
    ];
    
    const updateParams = [status, adminId, notes || ''];

    if (status === 'rejected' && reject_reason) {
      updateFields.push('reject_reason = ?');
      updateParams.push(reject_reason);
    }

    updateParams.push(id);

    await connection.execute(`
      UPDATE commission_records 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateParams);

    // 如果审核通过，添加到用户佣金余额
    if (status === 'approved') {
      await addCommissionToUserBalance(connection, commission);
    }

    console.log(`管理员 ${req.admin.email} ${status === 'approved' ? '通过' : '拒绝'}了佣金记录 ${id}`);

    res.json({
      success: true,
      message: status === 'approved' ? '佣金审核通过' : '佣金已拒绝',
      data: {
        commissionId: id,
        status,
        commission_amount: commission.commission_amount,
        referrer_name: commission.referrer_name
      }
    });

  } catch (error) {
    console.error('审核佣金记录失败:', error);
    res.status(500).json({
      success: false,
      message: '审核佣金记录失败'
    });
  }
});

/**
 * 将审核通过的佣金添加到用户佣金余额
 */
async function addCommissionToUserBalance(connection, commission) {
  try {
    console.log(`💰 佣金 ¥${commission.commission_amount} 将添加到用户 ${commission.referrer_id} 的余额`);
    
    // 检查用户是否已有佣金账户，如果没有则创建
    const [existingAccount] = await connection.execute(
      'SELECT * FROM commission_accounts WHERE user_id = ?',
      [commission.referrer_id]
    );
    
    if (existingAccount.length === 0) {
      // 创建新的佣金账户
      await connection.execute(`
        INSERT INTO commission_accounts 
        (user_id, total_earned, available_balance, frozen_balance, total_withdrawn, total_referrals)
        VALUES (?, ?, ?, 0, 0, 0)
      `, [commission.referrer_id, commission.commission_amount, commission.commission_amount]);
      
      console.log(`✅ 为用户 ${commission.referrer_id} 创建佣金账户并添加余额 ¥${commission.commission_amount}`);
    } else {
      // 更新现有佣金账户
      await connection.execute(`
        UPDATE commission_accounts 
        SET total_earned = total_earned + ?,
            available_balance = available_balance + ?,
            last_commission_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [commission.commission_amount, commission.commission_amount, commission.referrer_id]);
      
      console.log(`✅ 用户 ${commission.referrer_id} 佣金账户余额已增加 ¥${commission.commission_amount}`);
    }
    
  } catch (error) {
    console.error('添加佣金到用户余额失败:', error);
    throw error;
  }
}

module.exports = router;