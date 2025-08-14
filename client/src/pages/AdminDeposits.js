import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Calendar
} from 'lucide-react';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AdminDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});
  
  // 筛选和搜索状态
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  // 审核模态框状态
  const [reviewModal, setReviewModal] = useState({
    show: false,
    deposit: null,
    status: '',
    adminNotes: ''
  });

  useEffect(() => {
    fetchDeposits();
  }, [filters]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDeposits(filters);
      if (response.success) {
        setDeposits(response.data.deposits);
        setPagination(response.data.pagination);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Fetch deposits error:', error);
      toast.error('获取充值单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handleStatusFilter = (status) => {
    setFilters({ ...filters, status, page: 1 });
  };

  const openReviewModal = (deposit) => {
    setReviewModal({
      show: true,
      deposit,
      status: '',
      adminNotes: ''
    });
  };

  const closeReviewModal = () => {
    setReviewModal({
      show: false,
      deposit: null,
      status: '',
      adminNotes: ''
    });
  };

  const handleReview = async () => {
    if (!reviewModal.status) {
      toast.error('请选择审核结果');
      return;
    }

    try {
      const response = await adminAPI.reviewDeposit(reviewModal.deposit.id, {
        status: reviewModal.status,
        adminNotes: reviewModal.adminNotes
      });

      if (response.success) {
        toast.success(`充值单${reviewModal.status === 'approved' ? '审核通过' : '已拒绝'}`);
        closeReviewModal();
        fetchDeposits(); // 刷新列表
      }
    } catch (error) {
      console.error('Review deposit error:', error);
      toast.error('审核失败，请重试');
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '待审核', icon: Clock },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: '已通过', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '已拒绝', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">充值单管理</h1>
          <p className="mt-1 text-sm text-gray-600">
            管理和审核用户充值申请
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(stats.statusStats || {}).map(([status, data]) => (
          <div key={status} className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {status === 'pending' && '待审核'}
                  {status === 'approved' && '已通过'}
                  {status === 'rejected' && '已拒绝'}
                </p>
                <p className="text-xl font-bold text-gray-900">{data.count}</p>
                <p className="text-sm text-gray-500">{formatAmount(data.totalAmount)}</p>
              </div>
              {getStatusBadge(status)}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索用户邮箱、姓名或充值单号..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </form>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.status}
              onChange={(e) => handleStatusFilter(e.target.value)}
            >
              <option value="">所有状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <span className="text-gray-500">至</span>
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  充值单号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  支付方式
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-500">加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    暂无充值单数据
                  </td>
                </tr>
              ) : (
                deposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {deposit.user_name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {deposit.user_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {deposit.user_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {deposit.deposit_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatAmount(deposit.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deposit.payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(deposit.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(deposit.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openReviewModal(deposit)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {deposit.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setReviewModal({
                                  show: true,
                                  deposit,
                                  status: 'approved',
                                  adminNotes: ''
                                });
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setReviewModal({
                                  show: true,
                                  deposit,
                                  status: 'rejected',
                                  adminNotes: ''
                                });
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              显示 {((pagination.page - 1) * pagination.limit) + 1} 到{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
              共 {pagination.total} 条记录
            </div>
            <div className="flex items-center space-x-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setFilters({ ...filters, page })}
                  className={`px-3 py-1 rounded-md text-sm ${
                    page === pagination.page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal.show && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeReviewModal}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  审核充值单
                </h3>
                
                {/* Deposit Info */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">用户：</span>
                      {reviewModal.deposit?.user_name}
                    </div>
                    <div>
                      <span className="font-medium">金额：</span>
                      {formatAmount(reviewModal.deposit?.amount)}
                    </div>
                    <div>
                      <span className="font-medium">单号：</span>
                      {reviewModal.deposit?.deposit_number}
                    </div>
                    <div>
                      <span className="font-medium">支付方式：</span>
                      {reviewModal.deposit?.payment_method}
                    </div>
                  </div>
                </div>

                {/* Review Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      审核结果
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={reviewModal.status}
                      onChange={(e) => setReviewModal({ ...reviewModal, status: e.target.value })}
                    >
                      <option value="">请选择审核结果</option>
                      <option value="approved">通过</option>
                      <option value="rejected">拒绝</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      备注（可选）
                    </label>
                    <textarea
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="请输入审核备注..."
                      value={reviewModal.adminNotes}
                      onChange={(e) => setReviewModal({ ...reviewModal, adminNotes: e.target.value })}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end space-x-3">
                  <button
                    onClick={closeReviewModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleReview}
                    className={`px-4 py-2 rounded-lg text-white ${
                      reviewModal.status === 'approved'
                        ? 'bg-green-600 hover:bg-green-700'
                        : reviewModal.status === 'rejected'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!reviewModal.status}
                  >
                    确认审核
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeposits;
