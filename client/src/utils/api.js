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