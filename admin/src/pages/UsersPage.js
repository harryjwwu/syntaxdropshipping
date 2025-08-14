import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, UserCheck, UserX, Filter, Download, Ban, CheckCircle } from 'lucide-react';
import { adminAPI, apiUtils } from '../utils/api';
import toast from 'react-hot-toast';
import PasswordVerificationModal from '../components/PasswordVerificationModal';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  // 用户统计数据
  const [userStats, setUserStats] = useState({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    new_users_this_month: 0
  });
  
  // 搜索和筛选状态
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // 密码验证状态
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    loading: false,
    userData: null
  });
  
  // 密码验证对话框的ref
  const passwordModalRef = useRef();
  
  const navigate = useNavigate();

  // 获取用户列表
  const fetchUsers = async (params = {}) => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        ...params
      });
      
      setUsers(response.data.users);
      setPagination(response.data.pagination);
      if (response.data.stats) {
        setUserStats(response.data.stats);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      toast.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // 搜索处理
  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 状态筛选
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 分页处理
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // 查看用户详情
  const handleViewUser = (userId) => {
    navigate(`/users/${userId}`);
  };

  // 禁用/启用用户
  const handleToggleUserStatus = (userId, currentStatus, userName) => {
    const newStatus = !currentStatus;
    const action = newStatus ? '启用' : '禁用';
    
    // 打开密码验证对话框
    setPasswordModal({
      isOpen: true,
      loading: false,
      userData: { userId, newStatus, userName, action }
    });
  };

  // 处理密码验证
  const handlePasswordVerification = async (password) => {
    const { userId, newStatus, userName, action } = passwordModal.userData;
    
    setPasswordModal(prev => ({ ...prev, loading: true }));

    try {
      // 执行禁用/启用操作（包含密码验证）
      await adminAPI.toggleUserStatus(userId, newStatus, password);
      
      toast.success(`用户${action}成功`);
      
      // 清空密码
      passwordModalRef.current?.clearPassword();
      
      // 关闭对话框
      setPasswordModal({ isOpen: false, loading: false, userData: null });
      
      // 刷新用户列表
      fetchUsers();
    } catch (error) {
      console.error(`${action}用户失败:`, error);
      
      // 显示具体错误信息在对话框内
      const errorMessage = error.response?.data?.message || `${action}用户失败`;
      if (errorMessage.includes('Invalid verification password')) {
        // 使用对话框内的错误提示
        passwordModalRef.current?.showError('验证密码出错，请重新输入');
      } else {
        // 其他错误使用toast
        toast.error(errorMessage);
        // 关闭对话框
        setPasswordModal({ isOpen: false, loading: false, userData: null });
      }
      
      setPasswordModal(prev => ({ ...prev, loading: false }));
    }
  };

  // 关闭密码验证对话框
  const handleClosePasswordModal = () => {
    // 清空密码
    passwordModalRef.current?.clearPassword();
    setPasswordModal({ isOpen: false, loading: false, userData: null });
  };

  // 导出用户数据
  const handleExportUsers = async () => {
    try {
      toast.success('导出功能开发中...');
    } catch (error) {
      toast.error('导出失败');
    }
  };



  // 渲染用户头像
  const renderUserAvatar = (user) => {
    return (
      <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">用户管理</h1>
          <p className="mt-1 text-sm text-slate-600">管理和查看系统用户信息</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            筛选
          </button>
          <button
            onClick={handleExportUsers}
            className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
          >
            <Download className="h-4 w-4 mr-2" />
            导出
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索用户邮箱、姓名..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            搜索
          </button>
        </form>

        {/* 筛选选项 */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-slate-700">状态筛选:</span>
              <button
                onClick={() => handleStatusFilter('')}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  statusFilter === '' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => handleStatusFilter('active')}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  statusFilter === 'active' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                正常账户
              </button>
              <button
                onClick={() => handleStatusFilter('inactive')}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  statusFilter === 'inactive' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                禁用账户
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 活跃度说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">ℹ</span>
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">用户活跃度定义说明</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2"><strong>活跃用户</strong> - 满足以下任一条件：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>最近30天内有充值记录</li>
                <li>最近30天内有钱包交易记录</li>
              </ul>
              <p className="mt-2"><strong>非活跃用户</strong> - 不满足上述活跃用户条件的用户</p>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">总用户数</p>
              <p className="text-2xl font-bold text-slate-900">{userStats.total_users}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">活跃用户</p>
              <p className="text-2xl font-bold text-slate-900">{userStats.active_users}</p>
              <p className="text-xs text-slate-500">近30天有活动</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserX className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">非活跃用户</p>
              <p className="text-2xl font-bold text-slate-900">{userStats.inactive_users}</p>
              <p className="text-xs text-slate-500">近30天无活动</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">新用户(本月)</p>
              <p className="text-2xl font-bold text-slate-900">{userStats.new_users_this_month}</p>
              <p className="text-xs text-slate-500">近30天注册</p>
            </div>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-900">用户列表</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p className="mt-2 text-sm text-slate-600">加载中...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <UserX className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">暂无用户数据</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      用户信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      钱包余额
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      充值统计
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      账户状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      注册时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {renderUserAvatar(user)}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">
                              {user.name || '未设置姓名'}
                            </div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {apiUtils.formatAmount(user.balance || 0)}
                        </div>
                        <div className="text-sm text-slate-500">
                          累计充值: {apiUtils.formatAmount(user.total_deposited || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {user.deposit_count || 0} 笔充值
                        </div>
                        <div className="text-sm text-slate-500">
                          {user.approved_deposits || 0} 笔已通过
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {/* 账户状态 */}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            (user.status || user.is_active) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {(user.status || user.is_active) ? '正常' : '禁用'}
                          </span>
                          {/* 活跃度状态 */}
                          {user.activity_status && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              user.activity_status === 'active' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.activity_status === 'active' ? '活跃用户' : '非活跃用户'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {apiUtils.formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewUser(user.id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            详情
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleUserStatus(user.id, user.is_active, user.name || user.email)}
                              className={`inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded ${
                                user.is_active
                                  ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                  : 'text-green-700 bg-green-100 hover:bg-green-200'
                              }`}
                            >
                              {user.is_active ? (
                                <>
                                  <Ban className="h-3 w-3 mr-1" />
                                  禁用
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  启用
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-700">
                    显示第 {((pagination.page - 1) * pagination.limit) + 1} 到{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
                    共 {pagination.total} 条记录
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>
                    <span className="text-sm text-slate-700">
                      第 {pagination.page} 页，共 {pagination.pages} 页
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className="px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 密码验证对话框 */}
      <PasswordVerificationModal
        ref={passwordModalRef}
        isOpen={passwordModal.isOpen}
        onClose={handleClosePasswordModal}
        onConfirm={handlePasswordVerification}
        title="高危操作验证"
        message={passwordModal.userData ? 
          `您即将${passwordModal.userData.action}用户 "${passwordModal.userData.userName}"。此操作需要管理员二次密码验证。${passwordModal.userData.action === '禁用' ? '\n\n⚠️ 禁用后该用户将无法登录系统。' : ''}` : 
          '此操作需要管理员二次密码验证'
        }
        actionType={passwordModal.userData ? `确认${passwordModal.userData.action}` : '确认操作'}
        loading={passwordModal.loading}
      />
    </div>
  );
};

export default UsersPage;
