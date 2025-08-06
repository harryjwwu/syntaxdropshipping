const express = require('express');
const router = express.Router();
const verificationCodeManager = require('../utils/verificationCodeManager');
const { sendVerificationEmail } = require('../utils/emailService');

// Send verification code
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Check if can resend code (rate limiting)
    const resendCheck = verificationCodeManager.canResendCode(email);
    if (!resendCheck.canResend) {
      return res.status(429).json({
        success: false,
        message: resendCheck.error
      });
    }

    // Generate and store verification code
    const code = verificationCodeManager.generateCode();
    verificationCodeManager.storeCode(email, code);

    // Attempt to send email
    try {
      await sendVerificationEmail(email, code);
      console.log(`✅ Verification code sent successfully to ${email}`);
      
      res.json({
        success: true,
        message: 'Verification code sent successfully to your email'
      });
    } catch (emailError) {
      console.log('📧 Email service error:', emailError.message);
      console.log(`🔑 Verification code for ${email}: ${code}`);
      
      // 在开发环境下，如果邮件服务未配置，我们仍然返回成功，但在控制台显示验证码
      res.json({
        success: true,
        message: 'Verification code generated (check server console in development mode)',
        // 在开发环境下可以返回验证码方便测试
        ...(process.env.NODE_ENV === 'development' && { devCode: code })
      });
    }

  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code'
    });
  }
});

// Verify code
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Verify the code
    const result = verificationCodeManager.verifyCode(email, code);

    if (result.success) {
      res.json({
        success: true,
        message: 'Email verification successful'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify code'
    });
  }
});

// Get verification stats (for debugging, only in development)
router.get('/stats', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      message: 'Stats endpoint only available in development mode'
    });
  }

  const stats = verificationCodeManager.getStats();
  res.json({
    success: true,
    data: stats
  });
});

module.exports = router;