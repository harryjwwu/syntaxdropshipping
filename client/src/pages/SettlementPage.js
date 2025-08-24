import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Package,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { userSettlementAPI } from '../utils/api';
import toast from 'react-hot-toast';

const SettlementPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false
  });

  // 获取结算统计
  const fetchStats = async () => {
    try {
      const response = await userSettlementAPI.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取结算统计失败:', error);
    }
  };

  // 获取结算记录
  const fetchRecords = async (page = 1) => {
    try {
      setLoading(true);
      const response = await userSettlementAPI.getRecords({ page, limit: pagination.limit });
      
      if (response.data.success) {
        setRecords(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.data.message || '获取结算记录失败');
      }
    } catch (error) {
      console.error('获取结算记录失败:', error);
      toast.error('获取结算记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 查看结算详情
  const handleViewDetail = (record) => {
    navigate(`/settlement/records/${record.id}`);
  };

  // 格式化金额
  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  // 获取状态样式
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态文本
  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'pending':
        return '处理中';
      case 'cancelled':
        return '已取消';
      default:
        return '未知';
    }
  };

  // 分页处理
  const handlePageChange = (newPage) => {
    fetchRecords(newPage);
  };

  useEffect(() => {
    fetchStats();
    fetchRecords();
  }, []);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="flex items-center">
          <FileText className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settlement Records</h1>
            <p className="text-gray-600 mt-1">View your settlement history and account reconciliation</p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRecords || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">¥{formatAmount(stats.totalAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedRecords || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 结算记录列表 */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Settlement Records</h2>
          <p className="text-sm text-gray-600 mt-1">Your complete settlement history for account reconciliation</p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading settlement records...</p>
          </div>
        ) : records.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Settlement ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Settlement Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount & Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{record.id}</div>
                            <div className="text-gray-500">Client ID: {record.dxm_client_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm">
                            <div className="text-gray-900">{record.start_settlement_date}</div>
                            <div className="text-gray-500">to {record.end_settlement_date}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              ¥{formatAmount(record.total_settlement_amount)}
                            </div>
                            <div className="text-gray-500">{record.order_count} orders</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(record.status)}`}>
                          {getStatusText(record.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {new Date(record.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetail(record)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {pagination.page} of {pagination.totalPages} 
                    ({pagination.total} total records)
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* 页码按钮 */}
                    {(() => {
                      const currentPage = pagination.page;
                      const totalPages = pagination.totalPages;
                      const maxVisiblePages = 5;
                      
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                      
                      if (endPage - startPage + 1 < maxVisiblePages) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }
                      
                      const pages = [];
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            className={`px-3 py-1 border text-sm font-medium rounded-md ${
                              i === currentPage
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      return pages;
                    })()}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Settlement Records</h3>
            <p className="text-gray-500">You don't have any settlement records yet.</p>
            <p className="text-gray-400 text-sm mt-1">Settlement records will appear here once they are processed.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementPage;
