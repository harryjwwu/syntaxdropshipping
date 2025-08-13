import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      error.message = data.message || `Request failed with status ${status}`;
    } else if (error.request) {
      // Network error
      error.message = 'Network connection failed, please check your internet connection';
    } else {
      // Other error
      error.message = 'Request failed, please try again later';
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyToken: () => api.get('/auth/verify'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password })
};

// Verification API
export const verificationAPI = {
  sendCode: (email) => api.post('/verification/send-code', { email }),
  verifyCode: (email, code) => api.post('/verification/verify-code', { email, code }),
  getStats: () => api.get('/verification/stats') // Development only
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  changePassword: (passwordData) => api.put('/users/change-password', passwordData)
};

// Product API
export const productAPI = {
  getHotProducts: () => api.get('/products/hot'),
  getAllProducts: (params = {}) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  searchProducts: (query) => api.get(`/products?search=${encodeURIComponent(query)}`)
};

// Order API (for future implementation)
export const orderAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: (params = {}) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrder: (id, updateData) => api.put(`/orders/${id}`, updateData)
};

// Contact API
export const contactAPI = {
  sendMessage: (messageData) => api.post('/contact', messageData),
  subscribeNewsletter: (email) => api.post('/contact/newsletter', { email })
};

// Commission API
export const commissionAPI = {
  // 获取用户的推荐码
  getReferralCode: () => api.get('/commission/referral-code'),
  
  // 获取用户的佣金账户信息
  getAccount: () => api.get('/commission/account'),
  
  // 获取用户的佣金记录
  getRecords: (params = {}) => api.get('/commission/records', { params }),
  
  // 获取用户的提现记录
  getWithdrawals: (params = {}) => api.get('/commission/withdrawals', { params }),
  
  // 获取推荐统计信息
  getReferralStats: () => api.get('/commission/referral-stats'),
  
  // 申请提现
  requestWithdrawal: (withdrawalData) => api.post('/commission/withdraw', withdrawalData),
  
  // 获取推荐的用户列表
  getReferredUsers: (params = {}) => api.get('/commission/referred-users', { params }),
  
  // 获取佣金设置信息
  getSettings: () => api.get('/commission/settings'),
  
  // 验证推荐码
  validateReferral: (code) => api.get(`/commission/validate-referral/${code}`)
};

// Wallet API
export const walletAPI = {
  // 获取钱包余额
  getBalance: () => api.get('/wallet/balance'),
  
  // 获取系统银行账户信息
  getBankInfo: (currency = 'USD') => api.get(`/wallet/bank-info?currency=${currency}`),
  
  // 创建充值记录
  createDeposit: (depositData) => {
    const formData = new FormData();
    formData.append('amount', depositData.amount);
    formData.append('paymentMethod', depositData.paymentMethod);
    if (depositData.bankInfo) {
      formData.append('bankInfo', JSON.stringify(depositData.bankInfo));
    }
    if (depositData.paymentSlip) {
      formData.append('paymentSlip', depositData.paymentSlip);
    }
    
    return api.post('/wallet/deposit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // 获取充值记录
  getDeposits: (params = {}) => api.get('/wallet/deposits', { params }),
  
  // 获取交易历史
  getTransactions: (params = {}) => api.get('/wallet/transactions', { params }),
  
  // 管理员：获取所有充值记录
  adminGetDeposits: (params = {}) => api.get('/wallet/admin/deposits', { params }),
  
  // 管理员：处理充值申请
  adminProcessDeposit: (depositId, data) => api.put(`/wallet/admin/deposits/${depositId}`, data)
};

// Health check
export const healthAPI = {
  check: () => api.get('/health')
};

// Utility functions
export const apiUtils = {
  // Format error message for display
  formatErrorMessage: (error) => {
    if (typeof error === 'string') return error;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.message) return error.message;
    return 'Unknown error, please try again later';
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Clear auth data
  clearAuth: () => {
    localStorage.removeItem('token');
  },

  // Format price display
  formatPrice: (price) => {
    if (typeof price === 'string') return price;
    return `$${price.toFixed(2)}`;
  },

  // Format date
  formatDate: (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }
};

export default api;