import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Wallet, CreditCard, Activity, Filter, Percent } from 'lucide-react';
import { adminAPI, apiUtils } from '../utils/api';
import toast from 'react-hot-toast';

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [discountRules, setDiscountRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // 分页状态
  const [depositsPagination, setDepositsPagination] = useState({ page: 1, limit: 10 });
  const [transactionsPagination, setTransactionsPagination] = useState({ page: 1, limit: 10 });
  
  // 筛选状态
  const [depositStatusFilter, setDepositStatusFilter] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('');

  // 获取用户详情
  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUser(id);
      setUser(response.data.user);
      setUserStats(response.data.stats);
    } catch (error) {
      console.error('获取用户详情失败:', error);
      toast.error('获取用户详情失败');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  // 获取用户充值记录
  const fetchUserDeposits = async (params = {}) => {
    try {
      const response = await adminAPI.getUserDeposits(id, {
        page: depositsPagination.page,
        limit: depositsPagination.limit,
        status: depositStatusFilter,
        ...params
      });
      setDeposits(response.data.deposits);
      setDepositsPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error('获取充值记录失败:', error);
      toast.error('获取充值记录失败');
    }
  };

  // 获取用户交易记录
  const fetchUserTransactions = async (params = {}) => {
    try {
      const response = await adminAPI.getUserTransactions(id, {
        page: transactionsPagination.page,
        limit: transactionsPagination.limit,
        type: transactionTypeFilter,
        ...params
      });
      setTransactions(response.data.transactions);
      setTransactionsPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error('获取交易记录失败:', error);
      toast.error('获取交易记录失败');
    }
  };

  // 获取用户折扣规则
  const fetchDiscountRules = async () => {
    if (!user?.dxm_client_id) {
      setDiscountRules([]);
      return;
    }
    
    try {
      setDiscountLoading(true);
      const response = await adminAPI.getUserDiscountRules(user.dxm_client_id);
      if (response.success) {
        setDiscountRules(response.data || []);
      }
    } catch (error) {
      console.error('获取折扣规则失败:', error);
      // 不显示错误提示，静默失败
    } finally {
      setDiscountLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchUserDetail();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 根据活跃标签页加载数据
  useEffect(() => {
    if (activeTab === 'deposits') {
      fetchUserDeposits();
    } else if (activeTab === 'transactions') {
      fetchUserTransactions();
    } else if (activeTab === 'overview' && user) {
      fetchDiscountRules();
    }
  }, [activeTab, depositsPagination.page, transactionsPagination.page, depositStatusFilter, transactionTypeFilter, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // 渲染用户头像
  const renderUserAvatar = (user, size = 'lg') => {
    const sizeClasses = {
      sm: 'h-8 w-8 text-sm',
      md: 'h-12 w-12 text-base',
      lg: 'h-16 w-16 text-xl'
    };
    
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-primary-500 flex items-center justify-center text-white font-medium`}>
        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
      </div>
    );
  };

  // 获取状态标签
  const getStatusBadge = (status) => {
    const config = apiUtils.getStatusConfig(status);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // 获取交易类型标签
  const getTransactionTypeBadge = (type) => {
    const typeConfigs = {
      deposit: { bg: 'bg-green-100', text: 'text-green-800', label: '充值' },
      withdraw: { bg: 'bg-red-100', text: 'text-red-800', label: '提现' },
      commission: { bg: 'bg-blue-100', text: 'text-blue-800', label: '佣金' },
      refund: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '退款' }
    };
    
    const config = typeConfigs[type] || typeConfigs.deposit;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // 格式化折扣率显示
  const formatDiscountRate = (rate) => {
    return (rate * 10).toFixed(1) + '折';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <p className="ml-2 text-sm text-slate-600">加载中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">用户不存在</p>
          <button
            onClick={() => navigate('/users')}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
          >
            返回用户列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/users')}
          className="p-2 rounded-md border border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">用户详情</h1>
          <p className="mt-1 text-sm text-slate-600">查看和管理用户信息</p>
        </div>
      </div>

      {/* 用户基本信息卡片 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-start space-x-6">
          {renderUserAvatar(user, 'lg')}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {user.name || '未设置姓名'}
                </h2>
                <p className="text-sm text-slate-600">{user.email}</p>
                <div className="mt-2 flex items-center space-x-4">
                  {getStatusBadge(user.status || 'active')}
                  <span className="text-sm text-slate-500">
                    注册时间: {apiUtils.formatDate(user.created_at)}
                  </span>
                </div>
                {/* 邀请人信息 */}
                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">邀请信息</h4>
                  {user.referrer_id ? (
                    <div className="text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-600">来自邀请人:</span>
                        <span className="font-medium text-slate-900">
                          {user.referrer_name || '未设置姓名'}
                        </span>
                        <span className="text-slate-500">(ID: {user.referrer_id})</span>
                      </div>
                      <div className="mt-1 text-slate-500 text-xs">
                        {user.referrer_email}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">
                      自主注册，无邀请人
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 用户统计 */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Wallet className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-600">钱包余额</p>
                    <p className="text-lg font-bold text-slate-900">
                      {apiUtils.formatAmount(user.balance || 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CreditCard className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-600">累计充值</p>
                    <p className="text-lg font-bold text-slate-900">
                      {apiUtils.formatAmount(user.total_deposited || 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-600">充值次数</p>
                    <p className="text-lg font-bold text-slate-900">
                      {userStats?.total_deposits || 0}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-orange-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-600">通过率</p>
                    <p className="text-lg font-bold text-slate-900">
                      {userStats?.total_deposits > 0 
                        ? Math.round((userStats.approved_deposits / userStats.total_deposits) * 100)
                        : 0
                      }%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'overview', label: '概览', icon: User },
              { key: 'deposits', label: '充值记录', icon: CreditCard },
              { key: 'transactions', label: '交易记录', icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 标签页内容 */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 充值统计 */}
                <div>
                  <h3 className="text-lg font-medium text-slate-900 mb-4">充值统计</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">待审核充值</span>
                      <span className="text-sm font-medium text-yellow-600">
                        {userStats?.pending_deposits || 0} 笔
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">已通过充值</span>
                      <span className="text-sm font-medium text-green-600">
                        {userStats?.approved_deposits || 0} 笔
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">已拒绝充值</span>
                      <span className="text-sm font-medium text-red-600">
                        {userStats?.rejected_deposits || 0} 笔
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-sm font-medium text-slate-900">已通过金额</span>
                      <span className="text-sm font-bold text-slate-900">
                        {apiUtils.formatAmount(userStats?.total_approved_amount || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 钱包信息 */}
                <div>
                  <h3 className="text-lg font-medium text-slate-900 mb-4">钱包信息</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">可用余额</span>
                      <span className="text-sm font-medium text-green-600">
                        {apiUtils.formatAmount(user.balance || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">冻结余额</span>
                      <span className="text-sm font-medium text-red-600">
                        {apiUtils.formatAmount(user.frozen_balance || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">累计充值</span>
                      <span className="text-sm font-medium text-blue-600">
                        {apiUtils.formatAmount(user.total_deposited || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">累计提现</span>
                      <span className="text-sm font-medium text-purple-600">
                        {apiUtils.formatAmount(user.total_withdrawn || 0)}
                      </span>
                    </div>
                    {user.wallet_created_at && (
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-sm text-slate-600">钱包创建时间</span>
                        <span className="text-sm text-slate-500">
                          {apiUtils.formatDate(user.wallet_created_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 店小秘绑定与折扣规则 */}
                <div>
                  <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                    <Percent className="h-5 w-5 mr-2" />
                    订单折扣
                  </h3>
                  
                  {/* 店小秘绑定状态 */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">店小秘绑定</span>
                      {user.dxm_client_id ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          已绑定 #{user.dxm_client_id}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          未绑定
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 折扣规则 */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-slate-700">折扣规则</span>
                      {discountLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                      )}
                    </div>
                    
                    {!user.dxm_client_id ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs text-yellow-800">需要绑定店小秘才可设置折扣</p>
                      </div>
                    ) : discountRules.length === 0 ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-600">暂无折扣规则</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {discountRules.map((rule) => (
                          <div key={rule.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-green-800">
                                {rule.min_quantity}-{rule.max_quantity} 件
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {formatDiscountRate(rule.discount_rate)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {user.dxm_client_id && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-slate-500">
                          基于24小时内总下单件数
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deposits' && (
            <div className="space-y-4">
              {/* 筛选选项 */}
              <div className="flex items-center space-x-4">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">状态筛选:</span>
                <select
                  value={depositStatusFilter}
                  onChange={(e) => setDepositStatusFilter(e.target.value)}
                  className="px-3 py-1 border border-slate-300 rounded-md text-sm"
                >
                  <option value="">全部状态</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已拒绝</option>
                </select>
              </div>

              {/* 充值记录表格 */}
              {deposits.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">暂无充值记录</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          充值单号
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          金额
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          支付方式
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          创建时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          处理人
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {deposits.map((deposit) => (
                        <tr key={deposit.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {deposit.deposit_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {apiUtils.formatAmount(deposit.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {deposit.payment_method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(deposit.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {apiUtils.formatDate(deposit.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {deposit.admin_name || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {/* 筛选选项 */}
              <div className="flex items-center space-x-4">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">类型筛选:</span>
                <select
                  value={transactionTypeFilter}
                  onChange={(e) => setTransactionTypeFilter(e.target.value)}
                  className="px-3 py-1 border border-slate-300 rounded-md text-sm"
                >
                  <option value="">全部类型</option>
                  <option value="deposit">充值</option>
                  <option value="withdraw">提现</option>
                  <option value="commission">佣金</option>
                  <option value="refund">退款</option>
                </select>
              </div>

              {/* 交易记录表格 */}
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">暂无交易记录</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          交易号
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          类型
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          金额
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          余额变化
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          描述
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          时间
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {transaction.transaction_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getTransactionTypeBadge(transaction.type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <span className={transaction.type === 'withdraw' ? 'text-red-600' : 'text-green-600'}>
                              {transaction.type === 'withdraw' ? '-' : '+'}
                              {apiUtils.formatAmount(transaction.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {apiUtils.formatAmount(transaction.balance_before)} → {apiUtils.formatAmount(transaction.balance_after)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {apiUtils.formatDate(transaction.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
