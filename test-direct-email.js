const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });
const { sendVerificationEmail } = require('./server/utils/emailService');

async function testDirectEmail() {
  try {
    console.log('🧪 Testing direct email sending...');
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    
    await sendVerificationEmail('wuharryjwwu@gmail.com', '123456');
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    console.error('Full error:', error);
  }
}

testDirectEmail();