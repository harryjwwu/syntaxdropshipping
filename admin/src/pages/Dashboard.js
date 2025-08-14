import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Calendar,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminAPI, apiUtils } from '../utils/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">加载统计数据中...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, link }) => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1" />
              )}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {link && (
        <div className="mt-4">
          <Link
            to={link}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            查看详情
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">仪表板</h1>
        <p className="mt-1 text-sm text-slate-600">
          充值单管理和系统统计概览
        </p>
      </div>

      {/* Today Stats */}
      <div>
        <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          今日数据
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="今日充值总额"
            value={apiUtils.formatAmount(stats?.today?.approved_amount)}
            icon={DollarSign}
            color="bg-green-500"
            link="/deposits?status=approved&date=today"
          />
          <StatCard
            title="待审核"
            value={stats?.today?.pending_count || 0}
            icon={Clock}
            color="bg-yellow-500"
            link="/deposits?status=pending"
          />
          <StatCard
            title="今日已通过"
            value={stats?.today?.approved_count || 0}
            icon={CheckCircle}
            color="bg-green-600"
            link="/deposits?status=approved&date=today"
          />
          <StatCard
            title="今日已拒绝"
            value={stats?.today?.rejected_count || 0}
            icon={XCircle}
            color="bg-red-500"
            link="/deposits?status=rejected&date=today"
          />
        </div>
      </div>

      {/* Month Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-slate-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            本月统计
          </h3>
          <Link
            to="/deposits"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            查看所有充值单
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {apiUtils.formatAmount(stats?.month?.approved_amount)}
            </p>
            <p className="text-sm text-slate-600 mt-1">充值总额</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">
              {stats?.month?.total_deposits || 0}
            </p>
            <p className="text-sm text-slate-600 mt-1">充值单数</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {stats?.month?.approved_count || 0}
            </p>
            <p className="text-sm text-slate-600 mt-1">已通过</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">
              {stats?.month?.rejected_count || 0}
            </p>
            <p className="text-sm text-slate-600 mt-1">已拒绝</p>
          </div>
        </div>
      </div>

      {/* Pending Deposits */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-900 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              待审核充值单
            </h3>
            <Link
              to="/deposits?status=pending"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              查看全部
              <Eye className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
        <div className="divide-y divide-slate-200">
          {stats?.pendingDeposits?.length > 0 ? (
            stats.pendingDeposits.map((deposit) => (
              <div key={deposit.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
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
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {deposit.user_name} ({deposit.user_email})
                        </p>
                        <p className="text-sm text-slate-500">
                          单号：{deposit.deposit_number}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {apiUtils.formatAmount(deposit.amount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {apiUtils.formatRelativeTime(deposit.created_at)}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      待审核
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-slate-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">暂无待审核的充值单</p>
              <p className="text-sm mt-1">所有充值申请都已处理完毕</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/deposits?status=pending"
            className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <Clock className="h-8 w-8 text-yellow-500 group-hover:text-blue-600 mb-3" />
            <h4 className="font-medium text-slate-900 group-hover:text-blue-900">审核充值单</h4>
            <p className="text-sm text-slate-600 mt-1">处理待审核的充值申请</p>
          </Link>
          
          <Link
            to="/deposits"
            className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <DollarSign className="h-8 w-8 text-green-500 group-hover:text-blue-600 mb-3" />
            <h4 className="font-medium text-slate-900 group-hover:text-blue-900">充值记录</h4>
            <p className="text-sm text-slate-600 mt-1">查看所有充值记录</p>
          </Link>
          
          <Link
            to="/users"
            className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <TrendingUp className="h-8 w-8 text-blue-500 group-hover:text-blue-600 mb-3" />
            <h4 className="font-medium text-slate-900 group-hover:text-blue-900">用户管理</h4>
            <p className="text-sm text-slate-600 mt-1">管理系统用户</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
