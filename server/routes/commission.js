const express = require('express');
const router = express.Router();
const commissionManager = require('../utils/commissionManager');
const { authenticateToken: auth, requireAdmin } = require('../middleware/auth');
const { getConnection } = require('../config/database');

// 获取用户的推荐码
router.get('/referral-code', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const referralCode = await commissionManager.createReferralCodeForUser(userId);
    
    res.json({
      success: true,
      data: {
        referralCode,
        referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${referralCode}`
      }
    });
  } catch (error) {
    console.error('Error getting referral code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get referral code'
    });
  }
});

// 获取用户的佣金账户信息
router.get('/account', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const account = await commissionManager.getUserCommissionAccount(userId);
    
    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    console.error('Error getting commission account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission account'
    });
  }
});

// 获取用户的佣金记录
router.get('/records', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const records = await commissionManager.getUserCommissionRecords(userId, limit, offset);
    
    // 获取总记录数
    const db = await getConnection();
    const [totalCount] = await db.execute(
      'SELECT COUNT(*) as total FROM commission_records WHERE referrer_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total: totalCount[0].total,
          totalPages: Math.ceil(totalCount[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting commission records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission records'
    });
  }
});

// 获取用户的推荐统计
router.get('/referral-stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await commissionManager.getUserReferralStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get referral stats'
    });
  }
});

// 申请提现
router.post('/withdrawal', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, method, accountInfo } = req.body;

    // 验证输入
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid withdrawal amount'
      });
    }

    if (!method || !['bank_transfer', 'paypal', 'alipay', 'wechat'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid withdrawal method'
      });
    }

    if (!accountInfo || Object.keys(accountInfo).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Account information is required'
      });
    }

    // 获取用户佣金账户
    const account = await commissionManager.getUserCommissionAccount(userId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Commission account not found'
      });
    }

    // 检查余额是否足够
    if (parseFloat(account.available_balance) < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // 获取最小提现金额设置
    const [minAmountResult] = await db.execute(
      'SELECT setting_value FROM commission_settings WHERE setting_name = ? AND is_active = 1',
      ['min_withdrawal_amount']
    );
    const minAmount = minAmountResult.length > 0 ? parseFloat(minAmountResult[0].setting_value) : 10.00;

    if (parseFloat(amount) < minAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is $${minAmount}`
      });
    }

    // 获取最大提现金额设置
    const [maxAmountResult] = await db.execute(
      'SELECT setting_value FROM commission_settings WHERE setting_name = ? AND is_active = 1',
      ['max_withdrawal_amount']
    );
    const maxAmount = maxAmountResult.length > 0 ? parseFloat(maxAmountResult[0].setting_value) : 10000.00;

    if (parseFloat(amount) > maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Maximum withdrawal amount is $${maxAmount}`
      });
    }

    // 获取手续费比例
    const [feeRateResult] = await db.execute(
      'SELECT setting_value FROM commission_settings WHERE setting_name = ? AND is_active = 1',
      ['withdrawal_fee_rate']
    );
    const feeRate = feeRateResult.length > 0 ? parseFloat(feeRateResult[0].setting_value) : 0;

    const fee = (parseFloat(amount) * feeRate).toFixed(2);
    const actualAmount = (parseFloat(amount) - parseFloat(fee)).toFixed(2);

    // 生成提现单号
    const withdrawalNumber = `WD${Date.now()}${userId}`;

    // 开始事务
    await db.execute('START TRANSACTION');

    try {
      // 创建提现记录
      const [result] = await db.execute(
        `INSERT INTO commission_withdrawals 
         (user_id, withdrawal_number, amount, fee, actual_amount, method, account_info, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [userId, withdrawalNumber, amount, fee, actualAmount, method, JSON.stringify(accountInfo)]
      );

      // 更新用户佣金账户（冻结提现金额）
      await db.execute(
        `UPDATE commission_accounts 
         SET available_balance = available_balance - ?, 
             frozen_balance = frozen_balance + ? 
         WHERE user_id = ?`,
        [amount, amount, userId]
      );

      await db.execute('COMMIT');

      res.json({
        success: true,
        data: {
          withdrawalId: result.insertId,
          withdrawalNumber,
          amount,
          fee,
          actualAmount,
          status: 'pending'
        },
        message: 'Withdrawal request submitted successfully'
      });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal request'
    });
  }
});

// 获取提现记录
router.get('/withdrawals', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const db = await getConnection();
    const [withdrawals] = await db.execute(
      `SELECT id, withdrawal_number, amount, fee, actual_amount, method, 
              status, applied_at, processed_at, completed_at, admin_notes
       FROM commission_withdrawals 
       WHERE user_id = ? 
       ORDER BY applied_at DESC 
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      [userId]
    );

    // 获取总记录数
    const [totalCount] = await db.execute(
      'SELECT COUNT(*) as total FROM commission_withdrawals WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          page,
          limit,
          total: totalCount[0].total,
          totalPages: Math.ceil(totalCount[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting withdrawals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal records'
    });
  }
});

// 验证推荐码（注册时使用）
router.post('/validate-referral', async (req, res) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required'
      });
    }

    // 查找推荐人
    const [referrer] = await db.execute(
      `SELECT u.id, u.name, u.email 
       FROM users u 
       WHERE u.referral_code = ? AND u.is_active = 1`,
      [referralCode]
    );

    if (referrer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code'
      });
    }

    res.json({
      success: true,
      data: {
        referrer: {
          id: referrer[0].id,
          name: referrer[0].name,
          email: referrer[0].email
        }
      },
      message: 'Valid referral code'
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate referral code'
    });
  }
});

// 管理员路由 - 获取所有佣金记录
router.get('/admin/records', auth, async (req, res) => {
  try {
    // 检查管理员权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = `
      SELECT cr.*, 
             referrer.name as referrer_name, referrer.email as referrer_email,
             referee.name as referee_name, referee.email as referee_email,
             o.order_number, o.created_at as order_date
      FROM commission_records cr
      LEFT JOIN users referrer ON cr.referrer_id = referrer.id
      LEFT JOIN users referee ON cr.referee_id = referee.id
      LEFT JOIN orders o ON cr.order_id = o.id
    `;

    const params = [];

    if (status) {
      query += ' WHERE cr.status = ?';
      params.push(status);
    }

    query += ` ORDER BY cr.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [records] = await db.execute(query, params);

    // 获取总记录数
    let countQuery = 'SELECT COUNT(*) as total FROM commission_records cr';
    const countParams = [];

    if (status) {
      countQuery += ' WHERE cr.status = ?';
      countParams.push(status);
    }

    const [totalCount] = await db.execute(countQuery, countParams);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total: totalCount[0].total,
          totalPages: Math.ceil(totalCount[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting admin commission records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission records'
    });
  }
});

// 管理员路由 - 获取所有提现申请
router.get('/admin/withdrawals', auth, async (req, res) => {
  try {
    // 检查管理员权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = `
      SELECT cw.*, u.name as user_name, u.email as user_email,
             admin.name as admin_name
      FROM commission_withdrawals cw
      LEFT JOIN users u ON cw.user_id = u.id
      LEFT JOIN users admin ON cw.admin_id = admin.id
    `;

    const params = [];

    if (status) {
      query += ' WHERE cw.status = ?';
      params.push(status);
    }

    query += ` ORDER BY cw.applied_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [withdrawals] = await db.execute(query, params);

    // 获取总记录数
    let countQuery = 'SELECT COUNT(*) as total FROM commission_withdrawals cw';
    const countParams = [];

    if (status) {
      countQuery += ' WHERE cw.status = ?';
      countParams.push(status);
    }

    const [totalCount] = await db.execute(countQuery, countParams);

    res.json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          page,
          limit,
          total: totalCount[0].total,
          totalPages: Math.ceil(totalCount[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting admin withdrawals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal records'
    });
  }
});

// 管理员路由 - 处理提现申请
router.put('/admin/withdrawals/:id', auth, async (req, res) => {
  try {
    // 检查管理员权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const withdrawalId = req.params.id;
    const { status, adminNotes } = req.body;

    if (!['processing', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // 获取提现记录
    const [withdrawal] = await db.execute(
      'SELECT * FROM commission_withdrawals WHERE id = ?',
      [withdrawalId]
    );

    if (withdrawal.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    const withdrawalRecord = withdrawal[0];

    if (withdrawalRecord.status !== 'pending' && withdrawalRecord.status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal cannot be modified'
      });
    }

    // 开始事务
    await db.execute('START TRANSACTION');

    try {
      let updateQuery = '';
      let updateParams = [];

      if (status === 'completed') {
        // 完成提现
        updateQuery = `
          UPDATE commission_withdrawals 
          SET status = ?, admin_id = ?, admin_notes = ?, 
              processed_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `;
        updateParams = [status, req.user.id, adminNotes, withdrawalId];

        // 更新用户佣金账户（从冻结余额中扣除）
        await db.execute(
          `UPDATE commission_accounts 
           SET frozen_balance = frozen_balance - ?, 
               total_withdrawn = total_withdrawn + ? 
           WHERE user_id = ?`,
          [withdrawalRecord.amount, withdrawalRecord.amount, withdrawalRecord.user_id]
        );
      } else if (status === 'rejected') {
        // 拒绝提现
        updateQuery = `
          UPDATE commission_withdrawals 
          SET status = ?, admin_id = ?, admin_notes = ?, 
              processed_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `;
        updateParams = [status, req.user.id, adminNotes, withdrawalId];

        // 退还金额到可用余额
        await db.execute(
          `UPDATE commission_accounts 
           SET available_balance = available_balance + ?, 
               frozen_balance = frozen_balance - ? 
           WHERE user_id = ?`,
          [withdrawalRecord.amount, withdrawalRecord.amount, withdrawalRecord.user_id]
        );
      } else {
        // 处理中
        updateQuery = `
          UPDATE commission_withdrawals 
          SET status = ?, admin_id = ?, admin_notes = ?, 
              processed_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `;
        updateParams = [status, req.user.id, adminNotes, withdrawalId];
      }

      await db.execute(updateQuery, updateParams);
      await db.execute('COMMIT');

      res.json({
        success: true,
        message: `Withdrawal ${status} successfully`
      });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal'
    });
  }
});

module.exports = router;