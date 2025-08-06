// 邮件配置测试工具
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const nodemailer = require('nodemailer');

async function testEmailConfiguration() {
  console.log('🔧 Testing email configuration...\n');

  // 检查环境变量
  const config = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  };

  console.log('📋 Email Configuration:');
  console.log(`   SMTP Host: ${config.host}`);
  console.log(`   SMTP Port: ${config.port}`);
  console.log(`   SMTP User: ${config.user}`);
  console.log(`   SMTP Pass: ${config.pass ? '***hidden***' : 'NOT SET'}\n`);

  // 检查必需的配置
  if (!config.host || !config.port || !config.user || !config.pass) {
    console.log('❌ Missing email configuration');
    console.log('Please check your .env file and ensure all SMTP settings are configured\n');
    return false;
  }

  try {
    // 创建传输器
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: parseInt(config.port),
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.user,
        pass: config.pass
      }
    });

    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // 发送测试邮件
    console.log('📧 Sending test email...');
    const testEmail = {
      from: `"Syntax Dropshipping Test" <${config.user}>`,
      to: config.user, // 发送给自己
      subject: 'Email Configuration Test - Syntax Dropshipping',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; padding: 30px; background: #f8f9fa; border-radius: 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">🎉 Email Configuration Test</h2>
            <p style="color: #666; margin-bottom: 30px;">
              Congratulations! Your email service is properly configured.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
              <h3 style="color: #28a745; margin: 0;">✅ Test Successful</h3>
              <p style="margin: 10px 0 0 0; color: #666;">
                Your Syntax Dropshipping application can now send verification codes and other emails.
              </p>
            </div>
            <p style="color: #999; font-size: 14px; margin-top: 20px;">
              Test sent at: ${new Date().toLocaleString()}
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 5px;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              <strong>Syntax Dropshipping</strong> - Email Service Test
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`📮 Check your inbox at: ${config.user}`);
    console.log('\n🎉 Email configuration is working correctly!');
    
    return true;

  } catch (error) {
    console.log('❌ Email configuration test failed:');
    console.log(`   Error: ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Possible solutions:');
      console.log('   1. Check if your email and password are correct');
      console.log('   2. For Gmail: Make sure you are using an "App Password", not your regular password');
      console.log('   3. Enable 2-factor authentication and generate an app-specific password');
      console.log('   4. For other providers: Check if "Less secure app access" is enabled');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection issue:');
      console.log('   1. Check your internet connection');
      console.log('   2. Verify SMTP server settings');
      console.log('   3. Check if your firewall is blocking the connection');
    }
    
    console.log('\n📚 For detailed setup instructions, see EMAIL_CONFIG_GUIDE.md');
    return false;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testEmailConfiguration()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testEmailConfiguration };