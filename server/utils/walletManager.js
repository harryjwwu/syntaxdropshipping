const { getConnection } = require('../config/database');
const crypto = require('crypto');

class WalletManager {
  constructor() {
    this.defaultCurrency = 'USD';
  }

  /**
   * 生成充值单号
   * @returns {string} 充值单号
   */
  generateDepositNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DEP${timestamp}${random}`;
  }

  /**
   * 生成交易单号
   * @returns {string} 交易单号
   */
  generateTransactionNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TXN${timestamp}${random}`;
  }

  /**
   * 获取用户钱包信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 钱包信息
   */
  async getUserWallet(userId) {
    try {
      const db = await getConnection();
      
      // 确保用户有钱包
      await this.ensureUserWallet(userId);

      const [wallet] = await db.execute(
        'SELECT * FROM user_wallets WHERE user_id = ?',
        [userId]
      );

      return wallet[0] || null;
    } catch (error) {
      console.error('Error getting user wallet:', error);
      throw error;
    }
  }

  /**
   * 确保用户有钱包账户
   * @param {number} userId - 用户ID
   */
  async ensureUserWallet(userId) {
    try {
      const db = await getConnection();
      
      const [existing] = await db.execute(
        'SELECT user_id FROM user_wallets WHERE user_id = ?',
        [userId]
      );

      if (existing.length === 0) {
        await db.execute(
          'INSERT INTO user_wallets (user_id, balance) VALUES (?, 0.00)',
          [userId]
        );
      }
    } catch (error) {
      console.error('Error ensuring user wallet:', error);
      throw error;
    }
  }

  /**
   * 创建充值记录
   * @param {Object} depositData - 充值数据
   * @returns {Promise<Object>} 充值记录
   */
  async createDepositRecord(depositData) {
    try {
      const {
        userId,
        amount,
        paymentMethod,
        paymentSlip,
        bankInfo
      } = depositData;

      const db = await getConnection();
      const depositNumber = this.generateDepositNumber();

      const [result] = await db.execute(
        `INSERT INTO deposit_records 
         (user_id, deposit_number, amount, currency, payment_method, payment_slip, bank_info, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          userId,
          depositNumber,
          amount,
          this.defaultCurrency,
          paymentMethod,
          paymentSlip,
          JSON.stringify(bankInfo || {})
        ]
      );

      // 返回创建的记录
      const [newRecord] = await db.execute(
        'SELECT * FROM deposit_records WHERE id = ?',
        [result.insertId]
      );

      return newRecord[0];
    } catch (error) {
      console.error('Error creating deposit record:', error);
      throw error;
    }
  }

  /**
   * 获取用户充值记录
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制条数
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>} 充值记录列表
   */
  async getUserDepositRecords(userId, limit = 20, offset = 0) {
    try {
      const db = await getConnection();
      
      const [records] = await db.execute(
        `SELECT dr.*, u.name as admin_name
         FROM deposit_records dr
         LEFT JOIN users u ON dr.admin_id = u.id
         WHERE dr.user_id = ?
         ORDER BY dr.created_at DESC
         LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
        [userId]
      );

      return records;
    } catch (error) {
      console.error('Error getting user deposit records:', error);
      throw error;
    }
  }

  /**
   * 获取用户钱包交易记录
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制条数
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>} 交易记录列表
   */
  async getUserTransactionHistory(userId, limit = 20, offset = 0) {
    try {
      const db = await getConnection();
      
      const [transactions] = await db.execute(
        `SELECT * FROM wallet_transactions 
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
        [userId]
      );

      return transactions;
    } catch (error) {
      console.error('Error getting user transaction history:', error);
      throw error;
    }
  }

  /**
   * 处理充值审核（管理员功能）
   * @param {number} depositId - 充值记录ID
   * @param {string} status - 新状态 ('completed', 'rejected')
   * @param {number} adminId - 管理员ID
   * @param {string} adminNotes - 管理员备注
   * @returns {Promise<boolean>} 处理结果
   */
  async processDeposit(depositId, status, adminId, adminNotes = '') {
    try {
      const db = await getConnection();
      
      // 获取充值记录
      const [deposits] = await db.execute(
        'SELECT * FROM deposit_records WHERE id = ?',
        [depositId]
      );

      if (deposits.length === 0) {
        throw new Error('Deposit record not found');
      }

      const deposit = deposits[0];

      if (deposit.status !== 'pending') {
        throw new Error('Deposit already processed');
      }

      // 开始事务
      await db.execute('START TRANSACTION');

      try {
        // 更新充值记录状态
        await db.execute(
          `UPDATE deposit_records 
           SET status = ?, admin_id = ?, admin_notes = ?, processed_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [status, adminId, adminNotes, depositId]
        );

        if (status === 'completed') {
          // 获取用户当前余额
          const [wallet] = await db.execute(
            'SELECT balance FROM user_wallets WHERE user_id = ?',
            [deposit.user_id]
          );

          const currentBalance = parseFloat(wallet[0].balance);
          const depositAmount = parseFloat(deposit.amount);
          const newBalance = currentBalance + depositAmount;

          // 更新用户钱包余额
          await db.execute(
            `UPDATE user_wallets 
             SET balance = ?, total_deposited = total_deposited + ?
             WHERE user_id = ?`,
            [newBalance, depositAmount, deposit.user_id]
          );

          // 创建钱包交易记录
          const transactionNumber = this.generateTransactionNumber();
          await db.execute(
            `INSERT INTO wallet_transactions 
             (user_id, transaction_number, type, amount, balance_before, balance_after, 
              description, reference_id, reference_type)
             VALUES (?, ?, 'deposit', ?, ?, ?, ?, ?, 'deposit')`,
            [
              deposit.user_id,
              transactionNumber,
              depositAmount,
              currentBalance,
              newBalance,
              `Deposit via ${deposit.payment_method} - ${deposit.deposit_number}`,
              depositId,
            ]
          );
        }

        await db.execute('COMMIT');
        return true;
      } catch (error) {
        await db.execute('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error processing deposit:', error);
      throw error;
    }
  }

  /**
   * 获取系统银行账户信息
   * @param {string} currency - 货币类型
   * @returns {Promise<Object>} 银行账户信息
   */
  async getSystemBankAccount(currency = 'USD') {
    try {
      const db = await getConnection();
      
      // 根据货币类型确定设置键名
      let settingKey;
      if (currency.toLowerCase() === 'usd') {
        settingKey = 'payment_usd_bank_transfer';
      } else if (currency.toLowerCase() === 'eur') {
        settingKey = 'payment_eur_bank_transfer';
      } else {
        // 默认返回USD信息
        settingKey = 'payment_usd_bank_transfer';
      }
      
      const [settings] = await db.execute(
        'SELECT setting_value FROM system_settings WHERE setting_key = ? AND is_active = 1 LIMIT 1',
        [settingKey]
      );

      if (settings.length === 0) {
        return null;
      }

      // 解析JSON格式的设置值
      const paymentInfo = JSON.parse(settings[0].setting_value);
      
      // 检查是否启用
      if (!paymentInfo.is_enabled) {
        return null;
      }

      // 转换为前端期望的格式
      let bankAccount;
      
      if (currency.toLowerCase() === 'usd') {
        bankAccount = {
          account_number: paymentInfo.account_number,
          holder_name: paymentInfo.holder_name,
          support_currency: paymentInfo.support_currency || paymentInfo.currency,
          bank: paymentInfo.bank,
          bank_country_region: paymentInfo.bank_country_region,
          bank_address: paymentInfo.bank_address,
          account_type: paymentInfo.account_type,
          swift_code: paymentInfo.swift_code,
          wire_routing_number: paymentInfo.wire_routing_number,
          ach_routing_number: paymentInfo.ach_routing_number,
          swift_bic: paymentInfo.swift_bic
        };
      } else if (currency.toLowerCase() === 'eur') {
        bankAccount = {
          account_number_iban: paymentInfo.account_number_iban,
          holder_name: paymentInfo.holder_name,
          support_currency: paymentInfo.support_currency || paymentInfo.currency,
          bank: paymentInfo.bank,
          bank_country_region: paymentInfo.bank_country_region,
          bank_address: paymentInfo.bank_address,
          account_type: paymentInfo.account_type,
          swift_bic: paymentInfo.swift_bic
        };
      } else {
        // 默认USD格式
        bankAccount = {
          account_number: paymentInfo.account_number,
          holder_name: paymentInfo.holder_name,
          support_currency: paymentInfo.support_currency || paymentInfo.currency,
          bank: paymentInfo.bank,
          bank_country_region: paymentInfo.bank_country_region,
          bank_address: paymentInfo.bank_address,
          account_type: paymentInfo.account_type,
          swift_code: paymentInfo.swift_code,
          wire_routing_number: paymentInfo.wire_routing_number,
          ach_routing_number: paymentInfo.ach_routing_number,
          swift_bic: paymentInfo.swift_bic
        };
      }

      return bankAccount;
    } catch (error) {
      console.error('Error getting system bank account:', error);
      throw error;
    }
  }

  /**
   * 扣除钱包余额（用于订单支付等）
   * @param {number} userId - 用户ID
   * @param {number} amount - 扣除金额
   * @param {string} description - 交易描述
   * @param {number} referenceId - 关联ID
   * @param {string} referenceType - 关联类型
   * @returns {Promise<boolean>} 扣除结果
   */
  async deductBalance(userId, amount, description, referenceId = null, referenceType = null) {
    try {
      const db = await getConnection();
      
      await db.execute('START TRANSACTION');

      try {
        // 获取当前余额
        const [wallet] = await db.execute(
          'SELECT balance FROM user_wallets WHERE user_id = ? FOR UPDATE',
          [userId]
        );

        if (wallet.length === 0) {
          throw new Error('Wallet not found');
        }

        const currentBalance = parseFloat(wallet[0].balance);
        const deductAmount = parseFloat(amount);

        if (currentBalance < deductAmount) {
          throw new Error('Insufficient balance');
        }

        const newBalance = currentBalance - deductAmount;

        // 更新余额
        await db.execute(
          'UPDATE user_wallets SET balance = ? WHERE user_id = ?',
          [newBalance, userId]
        );

        // 创建交易记录
        const transactionNumber = this.generateTransactionNumber();
        await db.execute(
          `INSERT INTO wallet_transactions 
           (user_id, transaction_number, type, amount, balance_before, balance_after, 
            description, reference_id, reference_type)
           VALUES (?, ?, 'order_payment', ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            transactionNumber,
            deductAmount,
            currentBalance,
            newBalance,
            description,
            referenceId,
            referenceType
          ]
        );

        await db.execute('COMMIT');
        return true;
      } catch (error) {
        await db.execute('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error deducting balance:', error);
      throw error;
    }
  }
}

module.exports = new WalletManager();
