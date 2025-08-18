const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticateAdmin, logAction } = require('../middleware/adminAuth');
const { getConnection } = require('../config/database');
const { validateAdminLogin, logAdminAction } = require('../utils/initAdmin');

// 管理员登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const jwt = require('jsonwebtoken');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // 验证管理员登录
    const result = await validateAdminLogin(email, password);
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message
      });
    }

    const admin = result.admin;

    // 生成JWT token
    const token = jwt.sign(
      { 
        adminId: admin.id,
        email: admin.email,
        role: admin.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 记录登录日志
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    await logAdminAction(admin.id, 'login', null, null, 'Admin login', ipAddress, userAgent);

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          permissions: typeof admin.permissions === 'string' ? JSON.parse(admin.permissions) : admin.permissions
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// 获取充值单列表（管理员）
router.get('/deposits', authenticateAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status = '', 
      search = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;
    const connection = await getConnection();

    // 构建查询条件
    let whereConditions = [];
    let queryParams = [];

    if (status) {
      whereConditions.push('dr.status = ?');
      queryParams.push(status);
    }

    if (search) {
      whereConditions.push('(u.email LIKE ? OR u.name LIKE ? OR dr.deposit_number LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (startDate) {
      whereConditions.push('DATE(dr.created_at) >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(dr.created_at) <= ?');
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // 获取充值单列表
    const query = `
      SELECT 
        dr.*,
        u.name as user_name,
        u.email as user_email,
        a.name as admin_name
      FROM deposit_records dr
      LEFT JOIN users u ON dr.user_id = u.id
      LEFT JOIN admins a ON dr.admin_id = a.id
      ${whereClause}
      ORDER BY dr.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [deposits] = await connection.execute(query, queryParams);

    // 获取总记录数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM deposit_records dr
      LEFT JOIN users u ON dr.user_id = u.id
      ${whereClause}
    `;

    const [totalResult] = await connection.execute(countQuery, queryParams);
    const total = totalResult[0].total;

    // 获取状态统计
    const [statusStats] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM deposit_records
      GROUP BY status
    `);

    res.json({
      success: true,
      data: {
        deposits,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        stats: {
          statusStats: statusStats.reduce((acc, stat) => {
            acc[stat.status] = {
              count: stat.count,
              totalAmount: parseFloat(stat.total_amount || 0)
            };
            return acc;
          }, {})
        }
      }
    });

  } catch (error) {
    console.error('Get deposits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deposits'
    });
  }
});

// 审核充值单
router.put('/deposits/:id/review', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.admin.id;

    // 验证状态
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }

    const connection = await getConnection();

    // 检查充值单是否存在且为待审核状态
    const [deposits] = await connection.execute(
      'SELECT * FROM deposit_records WHERE id = ?',
      [id]
    );

    if (deposits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deposit record not found'
      });
    }

    const deposit = deposits[0];

    if (deposit.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Deposit record has already been reviewed'
      });
    }

    // 获取连接并开始事务
    const conn = await connection.getConnection();
    await conn.beginTransaction();

    try {
      // 更新充值单状态
      await conn.execute(
        `UPDATE deposit_records 
         SET status = ?, admin_id = ?, admin_notes = ?, processed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, adminId, adminNotes || null, id]
      );

      // 如果审核通过，更新用户钱包余额
      if (status === 'approved') {
        // 检查用户钱包是否存在，不存在则创建
        const [wallets] = await conn.execute(
          'SELECT * FROM user_wallets WHERE user_id = ?',
          [deposit.user_id]
        );

        if (wallets.length === 0) {
          await conn.execute(
            'INSERT INTO user_wallets (user_id, balance, total_deposited) VALUES (?, ?, ?)',
            [deposit.user_id, deposit.amount, deposit.amount]
          );
        } else {
          // 更新钱包余额
          await conn.execute(
            `UPDATE user_wallets 
             SET balance = balance + ?, 
                 total_deposited = total_deposited + ?
             WHERE user_id = ?`,
            [deposit.amount, deposit.amount, deposit.user_id]
          );
        }

        // 记录钱包交易
        const transactionNumber = `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        
        // 获取更新后的钱包余额
        const [updatedWallet] = await conn.execute(
          'SELECT balance FROM user_wallets WHERE user_id = ?',
          [deposit.user_id]
        );
        
        const balanceAfter = parseFloat(updatedWallet[0].balance);
        const balanceBefore = balanceAfter - parseFloat(deposit.amount);

        await conn.execute(
          `INSERT INTO wallet_transactions 
           (user_id, transaction_number, type, amount, balance_before, balance_after, 
            description, reference_id, reference_type, created_at)
           VALUES (?, ?, 'deposit', ?, ?, ?, ?, ?, 'deposit', CURRENT_TIMESTAMP)`,
          [
            deposit.user_id,
            transactionNumber,
            deposit.amount,
            balanceBefore,
            balanceAfter,
            `充值审核通过 - ${deposit.deposit_number}`,
            deposit.id
          ]
        );
      }

      await conn.commit();
      conn.release();

      // 获取更新后的记录
      const [updatedDeposit] = await connection.execute(`
        SELECT 
                  dr.*,
        u.name as user_name,
        u.email as user_email,
        a.name as admin_name
      FROM deposit_records dr
      LEFT JOIN users u ON dr.user_id = u.id
      LEFT JOIN admins a ON dr.admin_id = a.id
      WHERE dr.id = ?
      `, [id]);

      res.json({
        success: true,
        message: `Deposit ${status} successfully`,
        data: updatedDeposit[0]
      });

    } catch (error) {
      await conn.rollback();
      conn.release();
      throw error;
    }

  } catch (error) {
    console.error('Review deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review deposit'
    });
  }
});

// 获取充值单详情
router.get('/deposits/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await getConnection();

    const [deposits] = await connection.execute(`
      SELECT 
        dr.*,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        admin.name as admin_name
      FROM deposit_records dr
      LEFT JOIN users u ON dr.user_id = u.id
      LEFT JOIN users admin ON dr.admin_id = admin.id
      WHERE dr.id = ?
    `, [id]);

    if (deposits.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deposit record not found'
      });
    }

    res.json({
      success: true,
      data: deposits[0]
    });

  } catch (error) {
    console.error('Get deposit detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deposit detail'
    });
  }
});

// 获取管理员统计信息
router.get('/dashboard/stats', authenticateAdmin, async (req, res) => {
  try {
    const connection = await getConnection();

    // 获取今日统计
    const [todayStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_deposits,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount
      FROM deposit_records 
      WHERE DATE(created_at) = CURDATE()
    `);

    // 获取本月统计
    const [monthStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_deposits,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount
      FROM deposit_records 
      WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())
    `);

    // 获取待审核列表（最新10条）
    const [pendingDeposits] = await connection.execute(`
      SELECT 
        dr.id,
        dr.deposit_number,
        dr.amount,
        dr.created_at,
        u.name as user_name,
        u.email as user_email
      FROM deposit_records dr
      LEFT JOIN users u ON dr.user_id = u.id
      WHERE dr.status = 'pending'
      ORDER BY dr.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        today: todayStats[0],
        month: monthStats[0],
        pendingDeposits
      }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// ==================== 用户管理 API ====================

// 获取用户列表
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    const connection = await getConnection();

    // 构建搜索条件
    let whereClause = 'WHERE 1=1';
    let queryParams = [];

    if (search) {
      whereClause += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      if (status === 'active') {
        whereClause += ' AND u.is_active = 1';
      } else if (status === 'inactive') {
        whereClause += ' AND u.is_active = 0';
      }
    }

    // 获取用户列表（包含钱包信息和活跃度）
    const query = `
      SELECT 
        u.*,
        uw.balance,
        uw.total_deposited,
        uw.total_withdrawn,
        (SELECT COUNT(*) FROM deposit_records dr WHERE dr.user_id = u.id) as deposit_count,
        (SELECT COUNT(*) FROM deposit_records dr WHERE dr.user_id = u.id AND dr.status = 'approved') as approved_deposits,
        (SELECT MAX(dr.created_at) FROM deposit_records dr WHERE dr.user_id = u.id) as last_deposit_at,
        (SELECT MAX(wt.created_at) FROM wallet_transactions wt WHERE wt.user_id = u.id) as last_transaction_at,
        CASE 
          WHEN (
            SELECT COUNT(*) FROM deposit_records dr 
            WHERE dr.user_id = u.id 
            AND dr.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ) > 0 
          OR (
            SELECT COUNT(*) FROM wallet_transactions wt 
            WHERE wt.user_id = u.id 
            AND wt.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ) > 0
          THEN 'active'
          ELSE 'inactive'
        END as activity_status
      FROM users u
      LEFT JOIN user_wallets uw ON u.id = uw.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [users] = await connection.execute(query, queryParams);

    // 构建统计查询的参数（与主查询相同的逻辑）
    let statsQueryParams = [];
    let statsWhereClause = 'WHERE 1=1';
    
    if (search) {
      statsWhereClause += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      statsQueryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (status) {
      if (status === 'active') {
        statsWhereClause += ' AND u.is_active = 1';
      } else if (status === 'inactive') {
        statsWhereClause += ' AND u.is_active = 0';
      }
    }

    // 获取总记录数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM users u
      ${statsWhereClause}
    `;
    const [countResult] = await connection.execute(countQuery, statsQueryParams);
    const total = countResult[0].total;

    // 获取用户活跃度统计
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE 
          WHEN (
            SELECT COUNT(*) FROM deposit_records dr 
            WHERE dr.user_id = u.id 
            AND dr.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ) > 0 
          OR (
            SELECT COUNT(*) FROM wallet_transactions wt 
            WHERE wt.user_id = u.id 
            AND wt.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ) > 0
          THEN 1 
        END) as active_users,
        COUNT(CASE 
          WHEN (
            SELECT COUNT(*) FROM deposit_records dr 
            WHERE dr.user_id = u.id 
            AND dr.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ) = 0 
          AND (
            SELECT COUNT(*) FROM wallet_transactions wt 
            WHERE wt.user_id = u.id 
            AND wt.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ) = 0
          THEN 1 
        END) as inactive_users,
        COUNT(CASE 
          WHEN u.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          THEN 1 
        END) as new_users_this_month
      FROM users u
      ${statsWhereClause}
    `;
    const [statsResult] = await connection.execute(statsQuery, statsQueryParams);
    const stats = statsResult[0];

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        stats: {
          total_users: stats.total_users,
          active_users: stats.active_users,
          inactive_users: stats.inactive_users,
          new_users_this_month: stats.new_users_this_month
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// 获取用户详情
router.get('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await getConnection();

    // 获取用户基本信息和钱包信息
    const [users] = await connection.execute(`
      SELECT 
        u.*,
        uw.balance,
        uw.frozen_balance,
        uw.total_deposited,
        uw.total_withdrawn,
        uw.created_at as wallet_created_at,
        uw.updated_at as wallet_updated_at
      FROM users u
      LEFT JOIN user_wallets uw ON u.id = uw.user_id
      WHERE u.id = ?
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // 获取用户统计信息
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN dr.status = 'pending' THEN 1 END) as pending_deposits,
        COUNT(CASE WHEN dr.status = 'approved' THEN 1 END) as approved_deposits,
        COUNT(CASE WHEN dr.status = 'rejected' THEN 1 END) as rejected_deposits,
        SUM(CASE WHEN dr.status = 'approved' THEN dr.amount ELSE 0 END) as total_approved_amount,
        COUNT(*) as total_deposits
      FROM deposit_records dr
      WHERE dr.user_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        user,
        stats: stats[0]
      }
    });
  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
});

// 获取用户充值记录
router.get('/users/:id/deposits', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status = '' } = req.query;
    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    const connection = await getConnection();

    // 构建查询条件
    let whereClause = 'WHERE dr.user_id = ?';
    let queryParams = [id];

    if (status) {
      whereClause += ' AND dr.status = ?';
      queryParams.push(status);
    }

    // 获取充值记录
    const query = `
      SELECT 
        dr.*,
        a.name as admin_name
      FROM deposit_records dr
      LEFT JOIN admins a ON dr.admin_id = a.id
      ${whereClause}
      ORDER BY dr.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [deposits] = await connection.execute(query, queryParams);

    // 获取总记录数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM deposit_records dr
      ${whereClause}
    `;
    const [countResult] = await connection.execute(countQuery, queryParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        deposits,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get user deposits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user deposits'
    });
  }
});

// 获取用户钱包交易记录
router.get('/users/:id/transactions', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, type = '' } = req.query;
    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    const connection = await getConnection();

    // 构建查询条件
    let whereClause = 'WHERE wt.user_id = ?';
    let queryParams = [id];

    if (type) {
      whereClause += ' AND wt.type = ?';
      queryParams.push(type);
    }

    // 获取交易记录
    const query = `
      SELECT 
        wt.*
      FROM wallet_transactions wt
      ${whereClause}
      ORDER BY wt.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [transactions] = await connection.execute(query, queryParams);

    // 获取总记录数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM wallet_transactions wt
      ${whereClause}
    `;
    const [countResult] = await connection.execute(countQuery, queryParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user transactions'
    });
  }
});

// 验证管理员二次密码
router.post('/verify-admin-password', authenticateAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    const adminVerificationPassword = process.env.ADMIN_VERIFICATION_PASSWORD;
    
    if (!adminVerificationPassword) {
      return res.status(500).json({
        success: false,
        message: 'Admin verification password not configured'
      });
    }
    
    if (password !== adminVerificationPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification password'
      });
    }
    
    res.json({
      success: true,
      message: 'Password verified successfully'
    });
  } catch (error) {
    console.error('Admin password verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify password'
    });
  }
});

// 禁用/启用用户账户
router.put('/users/:id/toggle-status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, verification_password } = req.body;
    const adminId = req.admin.id;
    
    // 二次密码验证
    if (!verification_password) {
      return res.status(400).json({
        success: false,
        message: 'Verification password is required for this operation'
      });
    }
    
    const adminVerificationPassword = process.env.ADMIN_VERIFICATION_PASSWORD;
    if (verification_password !== adminVerificationPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification password'
      });
    }

    const connection = await getConnection();

    // 检查用户是否存在
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // 不能禁用管理员账户
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot disable admin account'
      });
    }

    // 更新用户状态
    await connection.execute(
      'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [is_active ? 1 : 0, id]
    );

    // 记录管理员操作日志（如果有admin_logs表）
    try {
      await connection.execute(
        `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, created_at) 
         VALUES (?, ?, 'user', ?, ?, CURRENT_TIMESTAMP)`,
        [
          adminId,
          is_active ? 'enable_user' : 'disable_user',
          id,
          JSON.stringify({
            user_email: user.email,
            user_name: user.name,
            previous_status: user.is_active,
            new_status: is_active ? 1 : 0
          })
        ]
      );
    } catch (logError) {
      // 如果日志记录失败，不影响主要功能
      console.warn('Failed to log admin action:', logError.message);
    }

    // 获取更新后的用户信息
    const [updatedUsers] = await connection.execute(
      'SELECT id, email, name, is_active, role, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: `User ${is_active ? 'enabled' : 'disabled'} successfully`,
      data: {
        user: updatedUsers[0]
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// 绑定店小秘客户ID
router.post('/bind-dxm-client', authenticateAdmin, async (req, res) => {
  const pool = await getConnection();
  
  try {
    const { userId, dxmClientId, adminPassword } = req.body;
    
    // 验证必需参数
    if (!userId || !dxmClientId || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: '用户ID、店小秘客户ID和管理员密码都是必需的'
      });
    }

    // 验证店小秘客户ID是否为有效数字
    const clientId = parseInt(dxmClientId);
    if (isNaN(clientId) || clientId <= 0) {
      return res.status(400).json({
        success: false,
        message: '店小秘客户ID必须是有效的正整数'
      });
    }

    // 验证管理员二次验证密码
    const adminVerificationPassword = process.env.ADMIN_VERIFICATION_PASSWORD;
    
    if (!adminVerificationPassword) {
      return res.status(500).json({
        success: false,
        message: 'Admin verification password not configured'
      });
    }
    
    if (adminPassword !== adminVerificationPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification password'
      });
    }

    // 检查用户是否存在
    const [userRows] = await pool.execute(
      'SELECT id, email, dxm_client_id FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const user = userRows[0];

    // 检查用户是否已经绑定了店小秘客户ID
    if (user.dxm_client_id) {
      return res.status(400).json({
        success: false,
        message: '该用户已经绑定了店小秘客户ID，不能重复绑定'
      });
    }

    // 检查店小秘客户ID是否已经被其他用户绑定
    const [existingRows] = await pool.execute(
      'SELECT id, email FROM users WHERE dxm_client_id = ?',
      [clientId]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `店小秘客户ID ${clientId} 已经被用户 ${existingRows[0].email} 绑定`
      });
    }

    // 执行绑定操作
    await pool.execute(
      'UPDATE users SET dxm_client_id = ? WHERE id = ?',
      [clientId, userId]
    );

    // 记录操作日志
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    await logAdminAction(
      req.admin.id,
      'bind_dxm_client',
      userId,
      { dxmClientId: clientId },
      `绑定店小秘客户ID ${clientId} 到用户 ${user.email}`,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      message: `成功将店小秘客户ID ${clientId} 绑定到用户 ${user.email}`,
      data: {
        userId: userId,
        dxmClientId: clientId,
        userEmail: user.email
      }
    });

  } catch (error) {
    console.error('绑定店小秘客户ID失败:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: '该店小秘客户ID已经被绑定'
      });
    }
    
    res.status(500).json({
      success: false,
      message: '绑定Shopify客户ID失败'
    });
  }
});

module.exports = router;
