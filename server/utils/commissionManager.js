const { getConnection } = require('../config/database');
const crypto = require('crypto');

class CommissionManager {
  constructor() {
    this.defaultCommissionRate = 0.02; // 2%
    this.defaultFreezePeriodDays = 15;
  }

  /**
   * 生成推荐码
   * @param {number} userId - 用户ID
   * @param {string} prefix - 推荐码前缀
   * @returns {string} 推荐码
   */
  generateReferralCode(userId, prefix = 'SYN') {
    const timestamp = Date.now().toString(36);
    const userHash = crypto.createHash('md5').update(userId.toString()).digest('hex').substring(0, 4);
    return `${prefix}${userHash}${timestamp}`.toUpperCase();
  }

  /**
   * 为用户创建推荐码
   * @param {number} userId - 用户ID
   * @returns {Promise<string>} 推荐码
   */
  async createReferralCodeForUser(userId) {
    try {
      const db = await getConnection();
      
      // 检查用户是否已有推荐码
      const [existingUser] = await db.execute(
        'SELECT referral_code FROM users WHERE id = ?',
        [userId]
      );

      if (existingUser.length > 0 && existingUser[0].referral_code) {
        return existingUser[0].referral_code;
      }

      // 生成新的推荐码
      let referralCode;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        referralCode = this.generateReferralCode(userId);
        
        // 检查推荐码是否唯一
        const [existing] = await db.execute(
          'SELECT id FROM users WHERE referral_code = ?',
          [referralCode]
        );

        if (existing.length === 0) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate unique referral code');
      }

      // 更新用户的推荐码
      await db.execute(
        'UPDATE users SET referral_code = ? WHERE id = ?',
        [referralCode, userId]
      );

      return referralCode;
    } catch (error) {
      console.error('Error creating referral code:', error);
      throw error;
    }
  }

  /**
   * 建立推荐关系
   * @param {string} referralCode - 推荐码
   * @param {number} newUserId - 新用户ID
   * @returns {Promise<boolean>} 是否成功建立关系
   */
  async establishReferralRelationship(referralCode, newUserId) {
    try {
      const db = await getConnection();
      
      // 查找推荐人
      const [referrer] = await db.execute(
        'SELECT id FROM users WHERE referral_code = ? AND is_active = 1',
        [referralCode]
      );

      if (referrer.length === 0) {
        throw new Error('Invalid referral code');
      }

      const referrerId = referrer[0].id;

      // 检查是否自己推荐自己
      if (referrerId === newUserId) {
        throw new Error('Cannot refer yourself');
      }

      // 检查新用户是否已有推荐人
      const [existingReferral] = await db.execute(
        'SELECT referred_by FROM users WHERE id = ?',
        [newUserId]
      );

      if (existingReferral.length > 0 && existingReferral[0].referred_by) {
        throw new Error('User already has a referrer');
      }

      // 开始事务
      await db.query('START TRANSACTION');

      try {
        // 更新用户的推荐人
        await db.execute(
          'UPDATE users SET referred_by = ? WHERE id = ?',
          [referrerId, newUserId]
        );

        // 创建推荐关系记录
        await db.execute(
          `INSERT INTO referral_relationships 
           (referrer_id, referee_id, referral_code, status) 
           VALUES (?, ?, ?, 'active')`,
          [referrerId, newUserId, referralCode]
        );

        // 创建或更新推荐人的佣金账户
        await this.ensureCommissionAccount(referrerId);

        // 更新推荐人的推荐统计
        await db.execute(
          `UPDATE commission_accounts 
           SET total_referrals = total_referrals + 1, 
               active_referrals = active_referrals + 1 
           WHERE user_id = ?`,
          [referrerId]
        );

        await db.query('COMMIT');
        return true;
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error establishing referral relationship:', error);
      throw error;
    }
  }

  /**
   * 确保用户有佣金账户
   * @param {number} userId - 用户ID
   */
  async ensureCommissionAccount(userId) {
    try {
      const db = await getConnection();
      
      const [existing] = await db.execute(
        'SELECT user_id FROM commission_accounts WHERE user_id = ?',
        [userId]
      );

      if (existing.length === 0) {
        await db.execute(
          `INSERT INTO commission_accounts (user_id) VALUES (?)`,
          [userId]
        );
      }
    } catch (error) {
      console.error('Error ensuring commission account:', error);
      throw error;
    }
  }

  /**
   * 计算并创建佣金记录
   * @param {number} orderId - 订单ID
   * @param {number} userId - 下单用户ID
   * @param {number} orderAmount - 订单金额
   * @returns {Promise<boolean>} 是否成功创建佣金记录
   */
  async calculateCommission(orderId, userId, orderAmount) {
    try {
      const db = await getConnection();
      
      // 检查用户是否有推荐人
      const [user] = await db.execute(
        'SELECT referred_by FROM users WHERE id = ? AND referred_by IS NOT NULL',
        [userId]
      );

      if (user.length === 0) {
        return false; // 没有推荐人，不产生佣金
      }

      const referrerId = user[0].referred_by;

      // 获取佣金设置
      const commissionRate = await this.getCommissionRate();
      const freezePeriodDays = await this.getFreezePeriodDays();

      // 计算佣金金额
      const commissionAmount = (orderAmount * commissionRate).toFixed(2);
      
      // 计算冻结截止时间
      const freezeUntil = new Date();
      freezeUntil.setDate(freezeUntil.getDate() + freezePeriodDays);

      // 开始事务
      await db.query('START TRANSACTION');

      try {
        // 创建佣金记录
        await db.execute(
          `INSERT INTO commission_records 
           (order_id, referrer_id, referee_id, order_amount, commission_amount, 
            commission_rate, status, freeze_until) 
           VALUES (?, ?, ?, ?, ?, ?, 'frozen', ?)`,
          [orderId, referrerId, userId, orderAmount, commissionAmount, 
           commissionRate, freezeUntil]
        );

        // 确保推荐人有佣金账户
        await this.ensureCommissionAccount(referrerId);

        // 更新推荐人的冻结余额
        await db.execute(
          `UPDATE commission_accounts 
           SET frozen_balance = frozen_balance + ?, 
               total_earned = total_earned + ?,
               last_commission_at = CURRENT_TIMESTAMP
           WHERE user_id = ?`,
          [commissionAmount, commissionAmount, referrerId]
        );

        await db.query('COMMIT');
        return true;
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error calculating commission:', error);
      throw error;
    }
  }

  /**
   * 处理冻结期到期的佣金
   * @returns {Promise<number>} 处理的记录数
   */
  async processExpiredFrozenCommissions() {
    try {
      const db = await getConnection();
      
      // 查找冻结期已到期的佣金记录
      const [expiredCommissions] = await db.execute(
        `SELECT id, referrer_id, commission_amount 
         FROM commission_records 
         WHERE status = 'frozen' AND freeze_until <= CURRENT_TIMESTAMP`
      );

      if (expiredCommissions.length === 0) {
        return 0;
      }

      let processedCount = 0;

      // 逐个处理到期的佣金
      for (const commission of expiredCommissions) {
        await db.execute('START TRANSACTION');

        try {
          // 更新佣金记录状态
          await db.execute(
            'UPDATE commission_records SET status = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['available', commission.id]
          );

          // 更新用户佣金账户
          await db.execute(
            `UPDATE commission_accounts 
             SET frozen_balance = frozen_balance - ?, 
                 available_balance = available_balance + ? 
             WHERE user_id = ?`,
            [commission.commission_amount, commission.commission_amount, commission.referrer_id]
          );

          await db.query('COMMIT');
          processedCount++;
        } catch (error) {
          await db.query('ROLLBACK');
          console.error(`Error processing commission ${commission.id}:`, error);
        }
      }

      return processedCount;
    } catch (error) {
      console.error('Error processing expired frozen commissions:', error);
      throw error;
    }
  }

  /**
   * 获取佣金比例设置
   * @returns {Promise<number>} 佣金比例
   */
  async getCommissionRate() {
    try {
      const db = await getConnection();
      
      const [result] = await db.execute(
        'SELECT setting_value FROM commission_settings WHERE setting_name = ? AND is_active = 1',
        ['default_commission_rate']
      );
      return result.length > 0 ? parseFloat(result[0].setting_value) : this.defaultCommissionRate;
    } catch (error) {
      console.error('Error getting commission rate:', error);
      return this.defaultCommissionRate;
    }
  }

  /**
   * 获取冻结期天数设置
   * @returns {Promise<number>} 冻结期天数
   */
  async getFreezePeriodDays() {
    try {
      const db = await getConnection();
      
      const [result] = await db.execute(
        'SELECT setting_value FROM commission_settings WHERE setting_name = ? AND is_active = 1',
        ['freeze_period_days']
      );
      return result.length > 0 ? parseInt(result[0].setting_value) : this.defaultFreezePeriodDays;
    } catch (error) {
      console.error('Error getting freeze period days:', error);
      return this.defaultFreezePeriodDays;
    }
  }

  /**
   * 获取用户的佣金账户信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 佣金账户信息
   */
  async getUserCommissionAccount(userId) {
    try {
      const db = await getConnection();
      
      await this.ensureCommissionAccount(userId);

      const [account] = await db.execute(
        `SELECT * FROM commission_accounts WHERE user_id = ?`,
        [userId]
      );

      return account.length > 0 ? account[0] : null;
    } catch (error) {
      console.error('Error getting user commission account:', error);
      throw error;
    }
  }

  /**
   * 获取用户的佣金记录
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制条数
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>} 佣金记录列表
   */
  async getUserCommissionRecords(userId, limit = 20, offset = 0) {
    try {
      const db = await getConnection();
      
      const [records] = await db.execute(
        `SELECT cr.*, u.name as referee_name, u.email as referee_email
         FROM commission_records cr
         LEFT JOIN users u ON cr.referee_id = u.id
         WHERE cr.referrer_id = ?
         ORDER BY cr.created_at DESC
         LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
        [userId]
      );

      return records;
    } catch (error) {
      console.error('Error getting user commission records:', error);
      throw error;
    }
  }

  /**
   * 获取用户的推荐统计
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 推荐统计信息
   */
  async getUserReferralStats(userId) {
    try {
      const db = await getConnection();
      
      // 获取推荐的用户列表
      const [referrals] = await db.execute(
        `SELECT u.id, u.name, u.email, u.created_at,
                COUNT(o.id) as order_count,
                COALESCE(SUM(o.total_amount), 0) as total_order_amount
         FROM users u
         LEFT JOIN orders o ON u.id = o.user_id AND o.status IN ('processing', 'shipped', 'delivered')
         WHERE u.referred_by = ?
         GROUP BY u.id, u.name, u.email, u.created_at
         ORDER BY u.created_at DESC`,
        [userId]
      );

      // 获取佣金统计
      const [commissionStats] = await db.execute(
        `SELECT 
           COUNT(*) as total_commissions,
           SUM(CASE WHEN status = 'available' THEN commission_amount ELSE 0 END) as available_commissions,
           SUM(CASE WHEN status = 'frozen' THEN commission_amount ELSE 0 END) as frozen_commissions,
           SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_commissions
         FROM commission_records 
         WHERE referrer_id = ?`,
        [userId]
      );

      return {
        referrals,
        commissionStats: commissionStats[0] || {
          total_commissions: 0,
          available_commissions: 0,
          frozen_commissions: 0,
          paid_commissions: 0
        }
      };
    } catch (error) {
      console.error('Error getting user referral stats:', error);
      throw error;
    }
  }
}

module.exports = new CommissionManager();