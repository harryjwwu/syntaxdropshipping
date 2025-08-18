const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

// 测试API接口
async function testDiscountAPI() {
  try {
    console.log('🚀 开始测试折扣规则API...\n');

    // 测试获取折扣规则
    console.log('📋 测试获取折扣规则 (DXM Client ID: 444)...');
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/user-discount-rules/444`, {
        headers: {
          'Authorization': 'Bearer test-token' // 这里需要实际的管理员token
        }
      });
      
      console.log('✅ API响应成功');
      console.log(`📊 找到 ${response.data.total} 条折扣规则`);
      
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach(rule => {
          const discountDisplay = (rule.discount_rate * 10).toFixed(1) + '折';
          console.log(`  - ${rule.min_quantity}-${rule.max_quantity}件: ${discountDisplay}`);
        });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ 需要管理员认证，这是正常的');
      } else {
        console.log('❌ API调用失败:', error.message);
      }
    }

    console.log('\n🎉 API测试完成！');

  } catch (error) {
    console.error('💥 测试过程中发生错误:', error.message);
  }
}

// 执行测试
if (require.main === module) {
  testDiscountAPI()
    .then(() => {
      console.log('✅ 测试脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testDiscountAPI };
