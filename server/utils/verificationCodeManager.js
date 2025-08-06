// 验证码管理器 - 使用内存存储（生产环境建议使用Redis）
class VerificationCodeManager {
  constructor() {
    // 存储验证码的Map: email -> {code, expiresAt, attempts}
    this.codes = new Map();
    // 验证码有效期（5分钟）
    this.EXPIRY_TIME = 5 * 60 * 1000;
    // 最大尝试次数
    this.MAX_ATTEMPTS = 3;
    // 清理过期验证码（每分钟执行一次）
    setInterval(() => this.cleanupExpiredCodes(), 60 * 1000);
  }

  // 生成6位数验证码
  generateCode() {
    return Math.random().toString().slice(2, 8).padStart(6, '0');
  }

  // 存储验证码
  storeCode(email, code) {
    const expiresAt = Date.now() + this.EXPIRY_TIME;
    this.codes.set(email.toLowerCase(), {
      code,
      expiresAt,
      attempts: 0,
      createdAt: Date.now()
    });
    console.log(`📧 Verification code stored for ${email}: ${code} (expires in 5 minutes)`);
  }

  // 验证验证码
  verifyCode(email, inputCode) {
    const emailKey = email.toLowerCase();
    const stored = this.codes.get(emailKey);

    if (!stored) {
      return { success: false, error: 'No verification code found for this email' };
    }

    if (Date.now() > stored.expiresAt) {
      this.codes.delete(emailKey);
      return { success: false, error: 'Verification code has expired' };
    }

    if (stored.attempts >= this.MAX_ATTEMPTS) {
      this.codes.delete(emailKey);
      return { success: false, error: 'Too many failed attempts. Please request a new code' };
    }

    if (stored.code !== inputCode) {
      stored.attempts++;
      return { 
        success: false, 
        error: `Invalid verification code. ${this.MAX_ATTEMPTS - stored.attempts} attempts remaining` 
      };
    }

    // 验证成功，删除验证码
    this.codes.delete(emailKey);
    return { success: true };
  }

  // 检查是否可以重新发送验证码（防止频繁发送）
  canResendCode(email) {
    const emailKey = email.toLowerCase();
    const stored = this.codes.get(emailKey);
    
    if (!stored) {
      return { canResend: true };
    }

    // 如果上次发送时间不到1分钟，不允许重发
    const timeSinceLastSend = Date.now() - stored.createdAt;
    const minInterval = 60 * 1000; // 1分钟

    if (timeSinceLastSend < minInterval) {
      const waitTime = Math.ceil((minInterval - timeSinceLastSend) / 1000);
      return { 
        canResend: false, 
        error: `Please wait ${waitTime} seconds before requesting a new code` 
      };
    }

    return { canResend: true };
  }

  // 清理过期验证码
  cleanupExpiredCodes() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [email, data] of this.codes.entries()) {
      if (now > data.expiresAt) {
        this.codes.delete(email);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired verification codes`);
    }
  }

  // 获取统计信息（调试用）
  getStats() {
    return {
      totalCodes: this.codes.size,
      codes: Array.from(this.codes.entries()).map(([email, data]) => ({
        email,
        expiresIn: Math.max(0, data.expiresAt - Date.now()),
        attempts: data.attempts
      }))
    };
  }
}

// 创建单例实例
const verificationCodeManager = new VerificationCodeManager();

module.exports = verificationCodeManager;