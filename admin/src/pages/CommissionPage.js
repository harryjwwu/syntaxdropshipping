import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  Users, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Filter,
  RefreshCw
} from 'lucide-react';
import { adminAPI, apiUtils } from '../utils/api';
import toast from 'react-hot-toast';

const CommissionPage = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  // 筛选状态
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // 统计数据
  const [stats, setStats] = useState({
    total_commissions: 0,
    pending_commissions: 0,
    approved_commissions: 0,
    rejected_commissions: 0,
    total_amount: 0,
    pending_amount: 0,
    approved_amount: 0
  });

  // 安全的数字格式化函数
  const formatAmount = (amount) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // 获取佣金记录列表
  const fetchCommissions = async (params = {}) => {
    try {
      setLoading(true);
      const response = await adminAPI.getCommissions({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter,
        search,
        ...params
      });
      
      setCommissions(response.data.commissions);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      });
      if (response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('获取佣金记录失败:', error);
      toast.error('获取佣金记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchCommissions();
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

  // 审核佣金
  const handleApproveCommission = async (commissionId, action) => {
    let rejectReason = '';
    
    if (action === 'reject') {
      rejectReason = prompt('请输入拒绝原因:');
      if (!rejectReason) {
        return; // 用户取消了输入
      }
    }
    
    try {
      await adminAPI.reviewCommission(commissionId, { 
        status: action === 'approve' ? 'approved' : 'rejected',
        reject_reason: action === 'reject' ? rejectReason : null,
        notes: action === 'approve' ? '管理员审核通过' : `管理员拒绝: ${rejectReason}`
      });
      
      toast.success(action === 'approve' ? '佣金审核通过' : '佣金已拒绝');
      fetchCommissions();
    } catch (error) {
      console.error('审核佣金失败:', error);
      toast.error('审核佣金失败');
    }
  };

  // 获取状态标签
  const getStatusBadge = (status) => {
    const statusConfigs = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '待审核' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: '已审核' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '已拒绝' }
    };
    
    const config = statusConfigs[status] || statusConfigs.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">佣金管理</h1>
          <p className="mt-1 text-sm text-slate-600">管理和审核用户佣金记录</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => fetchCommissions()}
            className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索邀请人姓名、邮箱..."
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
              onClick={() => handleStatusFilter('pending')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                statusFilter === 'pending' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              待审核
            </button>
            <button
              onClick={() => handleStatusFilter('approved')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                statusFilter === 'approved' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              已审核
            </button>
            <button
              onClick={() => handleStatusFilter('rejected')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                statusFilter === 'rejected' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              已拒绝
            </button>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Percent className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">总佣金记录</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total_commissions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">待审核</p>
              <p className="text-2xl font-bold text-slate-900">{stats.pending_commissions}</p>
              <p className="text-xs text-slate-500">¥{formatAmount(stats.pending_amount)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">已通过</p>
              <p className="text-2xl font-bold text-slate-900">{stats.approved_commissions}</p>
              <p className="text-xs text-slate-500">¥{formatAmount(stats.approved_amount)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">已拒绝</p>
              <p className="text-2xl font-bold text-slate-900">{stats.rejected_commissions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 佣金记录列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-900">佣金记录</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p className="mt-2 text-sm text-slate-600">加载中...</p>
          </div>
        ) : commissions.length === 0 ? (
          <div className="p-8 text-center">
            <Percent className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">暂无佣金记录</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      结算信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      邀请人信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      被邀请人信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      佣金信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">#{commission.settlement_id}</div>
                          <div className="text-slate-500">结算金额: ¥{formatAmount(commission.settlement_amount)}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">
                            {commission.referrer_name || '未设置姓名'}
                          </div>
                          <div className="text-slate-500">{commission.referrer_email}</div>
                          <div className="text-slate-400 text-xs">ID: {commission.referrer_id}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">
                            {commission.referee_name || '未设置姓名'}
                          </div>
                          <div className="text-slate-500">{commission.referee_email}</div>
                          <div className="text-slate-400 text-xs">ID: {commission.referee_id}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-bold text-orange-600">
                            ¥{formatAmount(commission.commission_amount)}
                          </div>
                          <div className="text-slate-500">
                            比例: {((parseFloat(commission.commission_rate) || 0) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(commission.status)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {apiUtils.formatDate(commission.created_at)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(`/settlement/records/${commission.settlement_id}`, '_blank')}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            查看结算
                          </button>
                          
                          {commission.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveCommission(commission.id, 'approve')}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                审核通过
                              </button>
                              <button
                                onClick={() => handleApproveCommission(commission.id, 'reject')}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                拒绝
                              </button>
                            </>
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
    </div>
  );
};

export default CommissionPage;
