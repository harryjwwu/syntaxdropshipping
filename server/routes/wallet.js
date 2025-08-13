const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const walletManager = require('../utils/walletManager');
const { authenticateToken: auth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/payment-slips');
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const ext = path.extname(file.originalname);
    cb(null, `payment-slip-${timestamp}-${random}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// 获取用户钱包信息
router.get('/balance', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const wallet = await walletManager.getUserWallet(userId);
    
    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        frozenBalance: wallet.frozen_balance,
        totalDeposited: wallet.total_deposited,
        totalWithdrawn: wallet.total_withdrawn
      }
    });
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet balance'
    });
  }
});

// 获取系统银行账户信息
router.get('/bank-info', auth, async (req, res) => {
  try {
    const currency = req.query.currency || 'USD';
    const bankAccount = await walletManager.getSystemBankAccount(currency);
    
    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found for this currency'
      });
    }

    res.json({
      success: true,
      data: bankAccount
    });
  } catch (error) {
    console.error('Error getting bank info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bank information'
    });
  }
});

// 创建充值记录
router.post('/deposit', [auth, upload.single('paymentSlip')], async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, paymentMethod, bankInfo } = req.body;

    // 验证输入
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    if (!paymentMethod || !['bank_transfer', 'paypal'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    // 处理上传的支付凭证
    let paymentSlipPath = null;
    if (req.file) {
      paymentSlipPath = `/uploads/payment-slips/${req.file.filename}`;
    }

    // 解析银行信息（如果是JSON字符串）
    let parsedBankInfo = {};
    if (bankInfo) {
      try {
        parsedBankInfo = typeof bankInfo === 'string' ? JSON.parse(bankInfo) : bankInfo;
      } catch (e) {
        parsedBankInfo = {};
      }
    }

    // 创建充值记录
    const depositRecord = await walletManager.createDepositRecord({
      userId,
      amount: parseFloat(amount),
      paymentMethod,
      paymentSlip: paymentSlipPath,
      bankInfo: parsedBankInfo
    });

    res.status(201).json({
      success: true,
      message: 'Deposit request submitted successfully',
      data: {
        depositNumber: depositRecord.deposit_number,
        amount: depositRecord.amount,
        status: depositRecord.status,
        paymentMethod: depositRecord.payment_method,
        createdAt: depositRecord.created_at
      }
    });

  } catch (error) {
    console.error('Error creating deposit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create deposit request'
    });
  }
});

// 获取用户充值记录
router.get('/deposits', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const deposits = await walletManager.getUserDepositRecords(userId, limit, offset);
    
    // 获取总记录数
    const { getConnection } = require('../config/database');
    const db = await getConnection();
    const [totalCount] = await db.execute(
      'SELECT COUNT(*) as total FROM deposit_records WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: {
        deposits,
        pagination: {
          page,
          limit,
          total: totalCount[0].total,
          totalPages: Math.ceil(totalCount[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting deposits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deposit records'
    });
  }
});

// 获取用户交易历史
router.get('/transactions', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const transactions = await walletManager.getUserTransactionHistory(userId, limit, offset);
    
    // 获取总记录数
    const { getConnection } = require('../config/database');
    const db = await getConnection();
    const [totalCount] = await db.execute(
      'SELECT COUNT(*) as total FROM wallet_transactions WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total: totalCount[0].total,
          totalPages: Math.ceil(totalCount[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction history'
    });
  }
});

// 管理员：获取所有充值记录
router.get('/admin/deposits', [auth, requireAdmin], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    const { getConnection } = require('../config/database');
    const db = await getConnection();

    let query = `
      SELECT dr.*, u.name as user_name, u.email as user_email,
             admin.name as admin_name
      FROM deposit_records dr
      LEFT JOIN users u ON dr.user_id = u.id
      LEFT JOIN users admin ON dr.admin_id = admin.id
    `;

    const params = [];

    if (status) {
      query += ' WHERE dr.status = ?';
      params.push(status);
    }

    query += ` ORDER BY dr.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [deposits] = await db.execute(query, params);

    // 获取总记录数
    let countQuery = 'SELECT COUNT(*) as total FROM deposit_records dr';
    const countParams = [];

    if (status) {
      countQuery += ' WHERE dr.status = ?';
      countParams.push(status);
    }

    const [totalCount] = await db.execute(countQuery, countParams);

    res.json({
      success: true,
      data: {
        deposits,
        pagination: {
          page,
          limit,
          total: totalCount[0].total,
          totalPages: Math.ceil(totalCount[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting admin deposits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deposit records'
    });
  }
});

// 管理员：处理充值申请
router.put('/admin/deposits/:id', [auth, requireAdmin], async (req, res) => {
  try {
    const depositId = req.params.id;
    const { status, adminNotes } = req.body;
    const adminId = req.user.id;

    if (!['completed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    await walletManager.processDeposit(depositId, status, adminId, adminNotes);

    res.json({
      success: true,
      message: `Deposit ${status} successfully`
    });
  } catch (error) {
    console.error('Error processing deposit:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process deposit'
    });
  }
});

module.exports = router;
