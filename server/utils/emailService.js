const nodemailer = require('nodemailer');

// Email configuration (使用环境变量配置)
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Create transporter function
let transporter = null;

function createTransporter() {
  if (!transporter) {
    try {
      transporter = nodemailer.createTransport(emailConfig);
      console.log('📧 Email transporter created successfully');
    } catch (error) {
      console.log('📧 Email service configuration error:', error.message);
      throw error;
    }
  }
  return transporter;
}

// Send verification code email
async function sendVerificationEmail(email, code) {
  try {
    const emailTransporter = createTransporter();

    const mailOptions = {
      from: `"Syntax Dropshipping" <${emailConfig.auth.user}>`,
      to: email,
      subject: 'Your Verification Code - Syntax Dropshipping',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px;">
            <h1 style="margin: 0; font-size: 28px;">Syntax Dropshipping</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
          </div>
          
          <div style="padding: 30px 20px; background: #f9f9f9; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-bottom: 20px;">Verification Code</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Please use the following verification code to complete your registration:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
                ${code}
              </div>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              This verification code will expire in <strong>5 minutes</strong>. Please do not share this code with anyone.
            </p>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              If you didn't request this verification code, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 14px;">
            <p>© 2024 Syntax Dropshipping. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('📧 Verification email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('📧 Email service error:', error.message);
    return { success: false, error: error.message };
  }
}

// Send welcome email
async function sendWelcomeEmail(email, name) {
  try {
    const emailTransporter = createTransporter();

    const mailOptions = {
      from: `"Syntax Dropshipping" <${emailConfig.auth.user}>`,
      to: email,
      subject: 'Welcome to Syntax Dropshipping!',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to Syntax Dropshipping</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Professional Dropshipping Solutions</p>
          </div>
          
          <div style="padding: 30px 20px; background: #f9f9f9; border-radius: 10px; margin: 20px 0;">
            <h2 style="color: #333; margin-bottom: 20px;">Dear ${name},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Thank you for choosing Syntax Dropshipping! We're committed to providing professional dropshipping services for e-commerce businesses, helping you achieve higher profitability.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
              <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
                <li>Browse our extensive product catalog</li>
                <li>Set up your dropshipping preferences</li>
                <li>Start building your e-commerce empire</li>
                <li>Enjoy competitive pricing and reliable shipping</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000/products" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Start Shopping Now
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              If you have any questions or need assistance, our support team is here to help. Contact us anytime!
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 14px;">
            <p>© 2024 Syntax Dropshipping. All rights reserved.</p>
            <p>Need help? Contact us at support@syntaxdropshipping.com</p>
          </div>
        </div>
      `
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('📧 Welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('📧 Welcome email error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  createTransporter
};