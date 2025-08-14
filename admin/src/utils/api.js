import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
});

// 请求拦截器 - 添加管理员token
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理token过期等错误
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || '';
      
      // 只有在真正的token过期时才清除登录状态
      // 密码验证失败不应该导致退出登录
      if (errorMessage.includes('Token') || 
          errorMessage.includes('Unauthorized') || 
          errorMessage.includes('Invalid token') ||
          errorMessage.includes('Token expired')) {
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
  
  // 验证管理员二次密码
  verifyAdminPassword: (password) => api.post('/admin/verify-admin-password', { password }),

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
  updateSystemSetting: (key, setting_value, description) => api.put(`/settings/${key}`, { setting_value, description })
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
