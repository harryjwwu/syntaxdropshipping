import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Users,
  Calendar,
  Eye
} from 'lucide-react';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
      toast.error('获取统计数据失败');
    } finally {
      setLoading(false);
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">管理员仪表板</h1>
        <p className="mt-1 text-sm text-gray-600">
          充值单管理和系统统计概览
        </p>
      </div>

      {/* Today Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">今日充值总额</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(stats?.today?.approved_amount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">待审核</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.today?.pending_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">今日已通过</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.today?.approved_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">今日已拒绝</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.today?.rejected_count || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Month Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            本月统计
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {formatAmount(stats?.month?.approved_amount)}
            </p>
            <p className="text-sm text-gray-600">充值总额</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {stats?.month?.total_deposits || 0}
            </p>
            <p className="text-sm text-gray-600">充值单数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {stats?.month?.approved_count || 0}
            </p>
            <p className="text-sm text-gray-600">已通过</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {stats?.month?.rejected_count || 0}
            </p>
            <p className="text-sm text-gray-600">已拒绝</p>
          </div>
        </div>
      </div>

      {/* Pending Deposits */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              待审核充值单
            </h3>
            <a
              href="/admin/deposits?status=pending"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              查看全部
              <Eye className="h-4 w-4 ml-1" />
            </a>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {stats?.pendingDeposits?.length > 0 ? (
            stats.pendingDeposits.map((deposit) => (
              <div key={deposit.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {deposit.user_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {deposit.user_name} ({deposit.user_email})
                        </p>
                        <p className="text-sm text-gray-500">
                          单号：{deposit.deposit_number}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatAmount(deposit.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(deposit.created_at)}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      待审核
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>暂无待审核的充值单</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
