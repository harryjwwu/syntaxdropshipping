import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  timeout: 30000, // 增加超时时间到30秒
  withCredentials: true, // 确保发送cookies
  headers: {
    'Content-Type': 'application/json',
  }
});

console.log('🔧 Axios实例配置:', {
  baseURL: api.defaults.baseURL,
  timeout: api.defaults.timeout,
  withCredentials: api.defaults.withCredentials
});

// 请求拦截器 - 添加管理员token
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken');
    console.log('🔍 API请求拦截器 - URL:', config.url);
    console.log('🔑 Token状态:', adminToken ? `存在 (${adminToken.substring(0, 20)}...)` : '不存在');
    
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
      console.log('✅ 已添加Authorization头');
    } else {
      console.warn('⚠️ 没有找到adminToken');
    }
    return config;
  },
  (error) => {
    console.error('❌ 请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理token过期等错误
api.interceptors.response.use(
  (response) => {
    console.log('✅ API响应成功 - URL:', response.config.url, '状态:', response.status);
    return response.data;
  },
  (error) => {
    console.error('❌ API响应错误 - URL:', error.config?.url);
    console.error('错误类型:', error.code);
    console.error('错误状态:', error.response?.status);
    console.error('错误信息:', error.response?.data || error.message);
    
    // 详细的网络错误诊断
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.error('🌐 网络错误详情:');
      console.error('- 请求URL:', error.config?.url);
      console.error('- 基础URL:', error.config?.baseURL);
      console.error('- 完整URL:', error.config?.baseURL + error.config?.url);
      console.error('- 请求方法:', error.config?.method);
      console.error('- 请求头:', error.config?.headers);
      
      // 尝试ping后端服务器
      fetch('http://localhost:5001/api/health')
        .then(response => {
          console.log('✅ 后端服务器可达，状态:', response.status);
        })
        .catch(fetchError => {
          console.error('❌ 后端服务器不可达:', fetchError.message);
        });
    }
    
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || '';
      
      // 只有在真正的token过期时才清除登录状态
      // 密码验证失败不应该导致退出登录
      if (errorMessage.includes('Token') || 
          errorMessage.includes('Unauthorized') || 
          errorMessage.includes('Invalid token') ||
          errorMessage.includes('Token expired')) {
        console.warn('🔑 Token过期，清除登录状态');
        // Token过期或无效，清除本地存储并跳转到登录页
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/login';
      }
      // 如果是密码验证失败等其他401错误，不清除登录状态
    }
    return Promise.reject(error);
  }
);

// Admin API
export const adminAPI = {
  // 管理员登录
  login: (credentials) => api.post('/admin/login', credentials),
  
  // 获取充值单列表
  getDeposits: (params = {}) => api.get('/admin/deposits', { params }),
  
  // 获取充值单详情
  getDeposit: (id) => api.get(`/admin/deposits/${id}`),
  
  // 审核充值单
  reviewDeposit: (id, reviewData) => api.put(`/admin/deposits/${id}/review`, reviewData),
  
  // 获取管理员统计
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // 获取管理员列表
  getAdmins: (params = {}) => api.get('/admin/admins', { params }),
  
  // 创建管理员
  createAdmin: (adminData) => api.post('/admin/admins', adminData),
  
  // 更新管理员
  updateAdmin: (id, adminData) => api.put(`/admin/admins/${id}`, adminData),
  
  // 删除管理员
  deleteAdmin: (id) => api.delete(`/admin/admins/${id}`),
  
  // 获取操作日志
  getLogs: (params = {}) => api.get('/admin/logs', { params }),
  
  // 修改密码
  changePassword: (passwordData) => api.put('/admin/change-password', passwordData),
  
  // 获取当前管理员信息
  getProfile: () => api.get('/admin/profile'),
  
  // 更新管理员资料
  updateProfile: (profileData) => api.put('/admin/profile', profileData),
  
  // ==================== 用户管理 API ====================
  
  // 获取用户列表
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  
  // 获取用户详情
  getUser: (id) => api.get(`/admin/users/${id}`),
  
  // 获取用户充值记录
  getUserDeposits: (id, params = {}) => api.get(`/admin/users/${id}/deposits`, { params }),
  
  // 获取用户钱包交易记录
  getUserTransactions: (id, params = {}) => api.get(`/admin/users/${id}/transactions`, { params }),
  
  // 禁用/启用用户账户
  toggleUserStatus: (id, is_active, verification_password) => api.put(`/admin/users/${id}/toggle-status`, { is_active, verification_password }),
  
  // 绑定店小秘客户ID
  bindDxmClient: (userId, dxmClientId, adminPassword) => api.post('/admin/bind-dxm-client', { 
    userId, 
    dxmClientId, 
    adminPassword 
  }),
  
  // 验证管理员二次密码
  verifyAdminPassword: (password) => api.post('/admin/verify-admin-password', { password }),

  // ==================== 用户折扣规则 API ====================
  // 获取用户折扣规则
  getUserDiscountRules: (dxmClientId) => api.get(`/admin/user-discount-rules/${dxmClientId}`),
  
  // 创建用户折扣规则
  createUserDiscountRule: (dxmClientId, ruleData) => api.post(`/admin/user-discount-rules/${dxmClientId}`, ruleData),
  
  // 更新用户折扣规则
  updateUserDiscountRule: (dxmClientId, ruleId, ruleData) => api.put(`/admin/user-discount-rules/${dxmClientId}/${ruleId}`, ruleData),
  
  // 删除用户折扣规则
  deleteUserDiscountRule: (dxmClientId, ruleId) => api.delete(`/admin/user-discount-rules/${dxmClientId}/${ruleId}`),
  
  // 批量删除用户折扣规则
  deleteAllUserDiscountRules: (dxmClientId) => api.delete(`/admin/user-discount-rules/${dxmClientId}`),

  // ==================== SPU管理 API ====================
  // 获取SPU列表
  getSpus: (params) => api.get('/admin/spus', { params }),
  
  // 获取单个SPU详情
  getSpu: (spu) => api.get(`/admin/spus/${spu}`),
  
  // 创建SPU
  createSpu: (spuData) => api.post('/admin/spus', spuData),
  
  // 更新SPU
  updateSpu: (spu, spuData) => api.put(`/admin/spus/${spu}`, spuData),
  
  // 删除SPU
  deleteSpu: (spu) => api.delete(`/admin/spus/${spu}`),
  
  // 为SPU添加SKU
  addSkuToSpu: (spu, sku) => api.post(`/admin/spus/${spu}/skus`, { sku }),
  
  // 删除SPU下的SKU
  removeSkuFromSpu: (spu, sku) => api.delete(`/admin/spus/${spu}/skus/${sku}`),

  // ==================== SPU报价管理 API ====================
  // 获取SPU报价列表
  getSpuQuotes: (params) => api.get('/admin/spu-quotes', { params }),
  
  // 获取单个报价详情
  getSpuQuote: (id) => api.get(`/admin/spu-quotes/${id}`),
  
  // 创建报价
  createSpuQuote: (quoteData) => api.post('/admin/spu-quotes', quoteData),
  
  // 更新报价
  updateSpuQuote: (id, quoteData) => api.put(`/admin/spu-quotes/${id}`, quoteData),
  
  // 删除报价
  deleteSpuQuote: (id) => api.delete(`/admin/spu-quotes/${id}`),
  
  // 批量创建报价
  batchCreateSpuQuotes: (quotes) => api.post('/admin/spu-quotes/batch', { quotes }),
  
  // 批量删除报价
  batchDeleteSpuQuotes: (ids) => api.delete('/admin/spu-quotes/batch', { data: { ids } }),
  
  // 获取国家列表
  getCountries: () => api.get('/admin/spu-quotes/countries/list'),

  // ==================== SPU价格历史 API ====================
  // 获取价格变更历史列表
  getSpuPriceHistory: (params) => api.get('/admin/spu-price-history', { params }),
  
  // 获取特定SPU的价格历史
  getSpuPriceHistoryBySpu: (spu, params) => api.get(`/admin/spu-price-history/spu/${spu}`, { params }),
  
  // 获取价格变更统计
  getSpuPriceHistoryStats: (params) => api.get('/admin/spu-price-history/stats', { params }),

  // ==================== COS上传 API ====================
  // 获取COS配置
  getCOSConfig: () => api.get('/cos/config'),
  
  // 服务端上传到COS
  uploadImageToCOS: (formData) => api.post('/cos/upload', formData),

  // ==================== 系统设置 API ====================
  // 获取支付信息设置
  getPaymentSettings: () => api.get('/settings/payment/info'),
  
  // 更新支付信息设置
  updatePaymentSettings: (type, paymentInfo) => api.put(`/settings/payment/${type}`, paymentInfo),
  
  // 获取系统设置
  getSystemSettings: (type) => api.get('/settings', { params: type ? { type } : {} }),
  
  // 获取单个系统设置
  getSystemSetting: (key) => api.get(`/settings/${key}`),
  
  // 更新系统设置
  updateSystemSetting: (key, setting_value, description) => api.put(`/settings/${key}`, { setting_value, description }),
  
  // 枚举值设置
  getEnumSettings: () => api.get('/settings/enum-values'),
  getEnumSetting: (key) => api.get(`/settings/enum-values/${key}`),
  updateEnumSetting: (key, values, description) => api.put(`/settings/enum-values/${key}`, { values, description }),
  
  // SPU管理
  getSpus: (params = {}) => api.get('/admin/spus', { params }),
  getSpu: (spu) => api.get(`/admin/spus/${spu}`),
  createSpu: (data) => api.post('/admin/spus', data),
  updateSpu: (spu, data) => api.put(`/admin/spus/${spu}`, data),
  deleteSpu: (spu) => api.delete(`/admin/spus/${spu}`),
  
  // SPU批量导入
  importSpus: (formData) => {
    return api.post('/admin/spu-batch-import/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60秒超时，批量导入可能需要较长时间
    });
  },
  downloadSpuTemplate: () => {
    return api.get('/admin/spu-batch-import/template', {
      responseType: 'blob'
    });
  },
  
  // SPU报价管理
  getSpuQuotes: (params = {}) => api.get('/admin/spu-quotes', { params }),
  getSpuQuote: (id) => api.get(`/admin/spu-quotes/${id}`),
  createSpuQuote: (data) => api.post('/admin/spu-quotes', data),
  updateSpuQuote: (id, data) => api.put(`/admin/spu-quotes/${id}`, data),
  deleteSpuQuote: (id) => api.delete(`/admin/spu-quotes/${id}`),
  
  // SPU价格历史
  getSpuPriceHistory: (params = {}) => api.get('/admin/spu-price-history', { params }),
  
  // COS相关
  getCOSConfig: () => api.get('/cos/config'),
  getCOSUploadSignature: (fileName, fileType = 'images') => api.post('/cos/signature', { fileName, fileType }),
  deleteCOSFile: (data) => api.delete('/cos/delete', { data }),

  // ==================== 结算管理 API ====================
  // 手动触发结算计算
  calculateSettlement: (data) => api.post('/admin/settlement/calculate', data),
  
  // 获取结算订单列表
  getSettlementOrders: (params) => api.get('/admin/settlement/orders', { params }),
  
  // 执行结算收款
  executeSettlement: (data) => api.post('/admin/settlement/execute', data),
  
  // 获取结算统计
  getSettlementStats: (date) => api.get(`/admin/settlement/stats/${date}`),
  
  // 获取结算记录列表
  getSettlementRecords: (params = {}) => api.get('/admin/settlement/records', { params }),
  
  // 获取结算记录详情
  getSettlementRecordDetail: (recordId) => api.get(`/admin/settlement/records/${recordId}`),

  // ==================== 佣金管理 API ====================
  // 获取佣金记录列表
  getCommissions: (params = {}) => api.get('/admin/commissions', { params }),
  
  // 审核佣金记录
  reviewCommission: (id, reviewData) => api.put(`/admin/commissions/${id}/review`, reviewData),
  
  // 获取佣金统计
  getCommissionStats: () => api.get('/admin/commissions/stats')
};

// 工具函数
export const apiUtils = {
  // 处理API错误
  handleError: (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response;
      return {
        success: false,
        message: data?.message || `HTTP Error: ${status}`,
        status
      };
    } else if (error.request) {
      // 网络错误
      return {
        success: false,
        message: '网络连接失败，请检查网络连接',
        status: 0
      };
    } else {
      // 其他错误
      return {
        success: false,
        message: error.message || '未知错误',
        status: -1
      };
    }
  },

  // 格式化金额
  formatAmount: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  },

  // 格式化日期
  formatDate: (dateString, options = {}) => {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Date(dateString).toLocaleDateString('zh-CN', {
      ...defaultOptions,
      ...options
    });
  },

  // 格式化相对时间
  formatRelativeTime: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return '刚刚';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分钟前`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}小时前`;
    } else if (diffInSeconds < 2592000) {
      return `${Math.floor(diffInSeconds / 86400)}天前`;
    } else {
      return apiUtils.formatDate(dateString, { year: 'numeric', month: 'short', day: 'numeric' });
    }
  },

  // 下载文件
  downloadFile: (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // 验证管理员权限
  hasPermission: (permission) => {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    
    // 超级管理员拥有所有权限
    if (adminUser.role === 'super_admin') {
      return true;
    }
    
    // 检查具体权限
    const permissions = adminUser.permissions || {};
    return permissions[permission] === true;
  },

  // 获取状态标签配置
  getStatusConfig: (status) => {
    const statusConfigs = {
      pending: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        label: '待审核',
        color: 'yellow'
      },
      approved: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        label: '已通过',
        color: 'green'
      },
      rejected: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        label: '已拒绝',
        color: 'red'
      },
      active: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        label: '活跃',
        color: 'green'
      },
      inactive: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800', 
        label: '非活跃',
        color: 'gray'
      }
    };

    return statusConfigs[status] || statusConfigs.pending;
  }
};

export default api;
