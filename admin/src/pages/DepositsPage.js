import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { adminAPI, apiUtils } from '../utils/api';
import toast from 'react-hot-toast';

const DepositsPage = () => {
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
    adminNotes: '',
    loading: false
  });

  useEffect(() => {
    fetchDeposits();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  const openReviewModal = (deposit, status = '') => {
    setReviewModal({
      show: true,
      deposit,
      status,
      adminNotes: '',
      loading: false
    });
  };

  const closeReviewModal = () => {
    setReviewModal({
      show: false,
      deposit: null,
      status: '',
      adminNotes: '',
      loading: false
    });
  };

  const handleReview = async () => {
    if (!reviewModal.status) {
      toast.error('请选择审核结果');
      return;
    }

    setReviewModal(prev => ({ ...prev, loading: true }));

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
    } finally {
      setReviewModal(prev => ({ ...prev, loading: false }));
    }
  };

  const getStatusBadge = (status) => {
    const config = apiUtils.getStatusConfig(status);
    const iconMap = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle
    };
    const Icon = iconMap[status] || Clock;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const StatusTabs = () => (
    <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
      {[
        { key: '', label: '全部', count: Object.values(stats.statusStats || {}).reduce((sum, stat) => sum + stat.count, 0) },
        { key: 'pending', label: '待审核', count: stats.statusStats?.pending?.count || 0 },
        { key: 'approved', label: '已通过', count: stats.statusStats?.approved?.count || 0 },
        { key: 'rejected', label: '已拒绝', count: stats.statusStats?.rejected?.count || 0 }
      ].map(tab => (
        <button
          key={tab.key}
          onClick={() => handleStatusFilter(tab.key)}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filters.status === tab.key
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {tab.label}
          {tab.count > 0 && (
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              filters.status === tab.key
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-200 text-slate-600'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">充值单管理</h1>
          <p className="mt-1 text-sm text-slate-600">
            管理和审核用户充值申请
          </p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-100 text-slate-900 hover:bg-slate-200">
          <Download className="h-4 w-4 mr-2" />
          导出数据
        </button>
      </div>

      {/* Status Tabs */}
      <StatusTabs />

      {/* Filters */}
      <div className="admin-card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索用户邮箱、姓名或充值单号..."
                className="admin-input pl-10"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </form>

          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              className="admin-input"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <span className="text-slate-500">至</span>
            <input
              type="date"
              className="admin-input"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Deposits Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead className="admin-table-header">
              <tr>
                <th className="admin-table-header-cell">用户信息</th>
                <th className="admin-table-header-cell">充值单号</th>
                <th className="admin-table-header-cell">金额</th>
                <th className="admin-table-header-cell">支付方式</th>
                <th className="admin-table-header-cell">状态</th>
                <th className="admin-table-header-cell">创建时间</th>
                <th className="admin-table-header-cell">操作</th>
              </tr>
            </thead>
            <tbody className="admin-table-body">
              {loading ? (
                <tr>
                  <td colSpan="7" className="admin-table-cell text-center py-12">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-slate-500">加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan="7" className="admin-table-cell text-center py-12 text-slate-500">
                    暂无充值单数据
                  </td>
                </tr>
              ) : (
                deposits.map((deposit) => (
                  <tr key={deposit.id} className="admin-table-row">
                    <td className="admin-table-cell">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {deposit.user_name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">
                            {deposit.user_name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {deposit.user_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="admin-table-cell font-mono">
                      {deposit.deposit_number}
                    </td>
                    <td className="admin-table-cell font-semibold">
                      {apiUtils.formatAmount(deposit.amount)}
                    </td>
                    <td className="admin-table-cell">
                      <span className="capitalize">{deposit.payment_method.replace('_', ' ')}</span>
                    </td>
                    <td className="admin-table-cell">
                      {getStatusBadge(deposit.status)}
                    </td>
                    <td className="admin-table-cell text-slate-500">
                      {apiUtils.formatDate(deposit.created_at)}
                    </td>
                    <td className="admin-table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openReviewModal(deposit)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {deposit.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openReviewModal(deposit, 'approved')}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="审核通过"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openReviewModal(deposit, 'rejected')}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="审核拒绝"
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
          <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-700">
              显示 {((pagination.page - 1) * pagination.limit) + 1} 到{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
              共 {pagination.total} 条记录
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50-secondary px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = Math.max(1, pagination.page - 2) + i;
                if (page > pagination.pages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      page === pagination.page
                        ? 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50-primary'
                        : 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50-secondary'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50-secondary px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal.show && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeReviewModal}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">
                  {reviewModal.status ? '审核充值单' : '充值单详情'}
                </h3>
                
                {/* Deposit Info */}
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">用户：</span>
                      <div className="mt-1">{reviewModal.deposit?.user_name}</div>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">邮箱：</span>
                      <div className="mt-1">{reviewModal.deposit?.user_email}</div>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">金额：</span>
                      <div className="mt-1 font-semibold text-lg">
                        {apiUtils.formatAmount(reviewModal.deposit?.amount)}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">支付方式：</span>
                      <div className="mt-1 capitalize">
                        {reviewModal.deposit?.payment_method?.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-slate-700">充值单号：</span>
                      <div className="mt-1 font-mono text-sm">
                        {reviewModal.deposit?.deposit_number}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-slate-700">创建时间：</span>
                      <div className="mt-1">
                        {apiUtils.formatDate(reviewModal.deposit?.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                {reviewModal.status && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        审核结果
                      </label>
                      <select
                        className="admin-input"
                        value={reviewModal.status}
                        onChange={(e) => setReviewModal({ ...reviewModal, status: e.target.value })}
                      >
                        <option value="">请选择审核结果</option>
                        <option value="approved">通过</option>
                        <option value="rejected">拒绝</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        备注（可选）
                      </label>
                      <textarea
                        rows={3}
                        className="admin-input"
                        placeholder="请输入审核备注..."
                        value={reviewModal.adminNotes}
                        onChange={(e) => setReviewModal({ ...reviewModal, adminNotes: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end space-x-3">
                  <button
                    onClick={closeReviewModal}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50-secondary"
                    disabled={reviewModal.loading}
                  >
                    {reviewModal.status ? '取消' : '关闭'}
                  </button>
                  {reviewModal.status && (
                    <button
                      onClick={handleReview}
                      disabled={!reviewModal.status || reviewModal.loading}
                      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                        reviewModal.status === 'approved'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : reviewModal.status === 'rejected'
                                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-slate-400 cursor-not-allowed text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {reviewModal.loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          处理中...
                        </div>
                      ) : (
                        '确认审核'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositsPage;
