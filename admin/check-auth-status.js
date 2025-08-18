// 在浏览器控制台中运行这个脚本来检查认证状态

console.log('🔍 检查前端认证状态...');

// 1. 检查localStorage中的token
const adminToken = localStorage.getItem('adminToken');
const adminUser = localStorage.getItem('adminUser');

console.log('📋 认证状态检查:');
console.log('Token存在:', !!adminToken);
console.log('Token长度:', adminToken ? adminToken.length : 0);
console.log('Token前20字符:', adminToken ? adminToken.substring(0, 20) + '...' : 'N/A');
console.log('用户信息:', adminUser ? JSON.parse(adminUser) : 'N/A');

// 2. 测试API调用
if (adminToken) {
  console.log('🧪 测试API调用...');
  
  // 测试SPU列表API
  fetch('http://localhost:5001/api/admin/spus?limit=10', {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('SPU API状态码:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ SPU API成功:', data);
  })
  .catch(error => {
    console.error('❌ SPU API失败:', error);
  });
  
  // 测试COS配置API
  fetch('http://localhost:5001/api/cos/config', {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('COS API状态码:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ COS API成功:', data);
  })
  .catch(error => {
    console.error('❌ COS API失败:', error);
  });
  
} else {
  console.warn('⚠️ 没有token，无法测试API');
  console.log('💡 请先登录: http://localhost:3002/login');
}
