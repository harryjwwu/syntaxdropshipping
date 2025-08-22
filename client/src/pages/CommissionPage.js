import React, { useState, useEffect } from 'react';
import { commissionAPI, settingsAPI, apiUtils } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';
import WhatsAppButton from '../components/WhatsAppButton';

const CommissionPage = () => {
  console.log('CommissionPage component rendered');
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [records, setRecords] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [referralStats, setReferralStats] = useState(null);
  const [commissionRules, setCommissionRules] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    method: 'bank_transfer',
    accountInfo: {
      bankName: '',
      accountNumber: '',
      accountName: '',
      swiftCode: ''
    }
  });

  useEffect(() => {
    console.log('=== CommissionPage useEffect called ===');
    
    // 简单测试
    const simpleTest = async () => {
      console.log('Starting simple test...');
      console.log('settingsAPI:', settingsAPI);
      
      if (settingsAPI && settingsAPI.getCommissionRules) {
        console.log('settingsAPI.getCommissionRules exists');
        try {
          console.log('Making API call...');
          const result = await settingsAPI.getCommissionRules();
          console.log('API call success:', result);
          setCommissionRules(result.data);
        } catch (error) {
          console.error('API call failed:', error);
        }
      } else {
        console.error('settingsAPI or getCommissionRules not found');
      }
    };
    
    simpleTest();
    fetchCommissionData();
  }, []);

  const fetchCommissionData = async () => {
    console.log('fetchCommissionData called');
    console.log('settingsAPI:', settingsAPI);
    try {
      setLoading(true);
      
      // 并行获取所有数据
      const [
        accountData,
        referralData,
        recordsData,
        withdrawalsData,
        statsData
      ] = await Promise.all([
        commissionAPI.getAccount(),
        commissionAPI.getReferralCode(),
        commissionAPI.getRecords({ limit: 10 }),
        commissionAPI.getWithdrawals({ limit: 10 }),
        commissionAPI.getReferralStats()
      ]);

      setAccount(accountData.data);
      setReferralCode(referralData.data.referralCode);
      setReferralLink(referralData.data.referralLink);
      setRecords(recordsData.data.records);
      setWithdrawals(withdrawalsData.data.withdrawals);
      setReferralStats(statsData.data);
      
      // 单独获取佣金规则，避免影响其他数据
      console.log('About to call settingsAPI.getCommissionRules()');
      try {
        console.log('Calling settingsAPI.getCommissionRules()...');
        const rulesData = await settingsAPI.getCommissionRules();
        console.log('API call completed');
        console.log('Commission Rules Raw Response:', rulesData);
        console.log('Commission Rules Data:', rulesData.data);
        setCommissionRules(rulesData.data);
      } catch (rulesError) {
        console.error('Error fetching commission rules:', rulesError);
        // 设置默认值
        setCommissionRules({
          first_level_rate: 2.0,
          description: '只支持一层推荐返佣：一级返佣 2%\nA 推荐 B → B 下单后支付金额的 2% 给 A\nB 推荐 C → C 下单后支付金额的 2% 给 B，C的付款金额不与A关联',
          is_enabled: true
        });
      }
    } catch (error) {
      console.error('Error fetching commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied to clipboard!');
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const withdrawalData = {
        amount: parseFloat(withdrawalForm.amount),
        method: withdrawalForm.method,
        accountInfo: withdrawalForm.accountInfo
      };

      await commissionAPI.applyWithdrawal(withdrawalData);
      alert('提现申请提交成功！');
      setShowWithdrawalModal(false);
      setWithdrawalForm({
        amount: '',
        method: 'bank_transfer',
        accountInfo: {
          bankName: '',
          accountNumber: '',
          accountName: '',
          swiftCode: ''
        }
      });
      
      // 重新获取数据
      fetchCommissionData();
    } catch (error) {
      alert(apiUtils.formatErrorMessage(error));
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'frozen': 'Frozen',
      'available': 'Available',
      'paid': 'Paid',
      'cancelled': 'Cancelled',
      'processing': 'Processing',
      'completed': 'Completed',
      'rejected': 'Rejected'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': 'text-yellow-600',
      'frozen': 'text-blue-600',
      'available': 'text-green-600',
      'paid': 'text-gray-600',
      'cancelled': 'text-red-600',
      'processing': 'text-blue-600',
      'completed': 'text-green-600',
      'rejected': 'text-red-600'
    };
    return colorMap[status] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 mt-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('commission.title')}</h1>
          <p className="mt-2 text-gray-600">{t('commission.subtitle')}</p>
        </div>

        {/* 佣金概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('commission.availableBalance')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(account?.available_balance)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Frozen Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(account?.frozen_balance)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(account?.total_earned)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Referrals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {account?.total_referrals || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Support */}
        <div className="bg-green-50 rounded-lg border border-green-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help with Affiliate?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Have questions about your affiliate account, withdrawals, or referral program? Get instant support via WhatsApp.
              </p>
            </div>
            <div className="ml-6">
              <WhatsAppButton 
                variant="inline"
                messageKey="whatsapp.supportMessage"
                className="whitespace-nowrap"
              />
            </div>
          </div>
        </div>

        {/* Tab导航 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'referral', name: 'Referral Management', icon: '👥' },
                { id: 'records', name: 'Commission Records', icon: '📋' },
                { id: 'withdrawals', name: 'Withdrawal Records', icon: '💰' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* 概览标签页 */}
            {activeTab === 'overview' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Account Overview</h3>
                  <button
                    onClick={() => setShowWithdrawalModal(true)}
                    disabled={!account?.available_balance || parseFloat(account.available_balance) <= 0}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Apply Withdrawal
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Recent Commission Records</h4>
                    <div className="space-y-3">
                      {records.slice(0, 5).map((record) => (
                        <div key={record.id} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Order #{record.order_number}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(record.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">
                              +{formatCurrency(record.commission_amount)}
                            </p>
                            <p className={`text-xs ${getStatusColor(record.status)}`}>
                              {getStatusText(record.status)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {records.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No commission records yet</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                                                <h4 className="font-medium text-gray-900 mb-4">Referral Statistics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Referrals</span>
                        <span className="font-medium">{referralStats?.referrals?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Users</span>
                        <span className="font-medium">{account?.active_referrals || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Commissions</span>
                        <span className="font-medium">{referralStats?.commissionStats?.total_commissions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Withdrawn Amount</span>
                        <span className="font-medium">{formatCurrency(account?.total_withdrawn)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 佣金规则展示 */}
                <div className="mt-6 bg-red-100 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">测试区域</p>
                  <p className="text-red-600">commissionRules: {commissionRules ? '已加载' : '未加载'}</p>
                  <p className="text-red-600">is_enabled: {commissionRules?.is_enabled ? '启用' : '未启用'}</p>
                  <p className="text-red-600">rate: {commissionRules?.first_level_rate || 'N/A'}%</p>
                </div>
                
                {commissionRules && (
                  <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg mr-3">
                        <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-purple-800">Commission Rules</h4>
                        <p className="text-sm text-purple-600">Current referral commission rate: <span className="font-bold">{commissionRules.first_level_rate}%</span></p>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-purple-200 rounded-lg p-4">
                      <div className="text-sm text-purple-700 whitespace-pre-line leading-relaxed">
                        {commissionRules.description}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 推荐管理标签页 */}
            {activeTab === 'referral' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Referral Management</h3>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="font-medium text-gray-900 mb-4">My Referral Link</h4>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={referralLink}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                      />
                    </div>
                    <button
                      onClick={handleCopyReferralLink}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Copy Link
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Referral Code: <span className="font-mono font-medium">{referralCode}</span>
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Referred Users List</h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User Info
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Registration Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order Count
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Orders
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {referralStats?.referrals?.map((referral) => (
                          <tr key={referral.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {referral.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {referral.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(referral.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {referral.order_count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(referral.total_order_amount)}
                            </td>
                          </tr>
                        ))}
                        {(!referralStats?.referrals || referralStats.referrals.length === 0) && (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                              No referred users yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 佣金记录标签页 */}
            {activeTab === 'records' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Commission Records</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            记录信息
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            结算信息
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            被推荐人信息
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            佣金信息
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            状态信息
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            时间信息
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {records.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">ID: {record.id}</div>
                                <div className="text-gray-500">推荐人ID: {record.referrer_id}</div>
                                <div className="text-gray-500">被推荐人ID: {record.referee_id}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">#{record.settlement_id}</div>
                                <div className="text-gray-500">结算金额: {formatCurrency(record.settlement_amount)}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">{record.referee_name}</div>
                                <div className="text-gray-500">{record.referee_email}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <div className="font-medium text-green-600">{formatCurrency(record.commission_amount)}</div>
                                <div className="text-gray-500">比例: {(parseFloat(record.commission_rate) * 100).toFixed(2)}%</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  record.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {record.status === 'approved' ? '已通过' :
                                   record.status === 'pending' ? '待审核' : '已拒绝'}
                                </span>
                                {record.admin_id && (
                                  <div className="text-gray-500 mt-1">审核人ID: {record.admin_id}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <div className="text-gray-900">创建: {formatDate(record.created_at)}</div>
                                {record.approved_at && (
                                  <div className="text-green-600">通过: {formatDate(record.approved_at)}</div>
                                )}
                                {record.updated_at && record.updated_at !== record.created_at && (
                                  <div className="text-gray-500">更新: {formatDate(record.updated_at)}</div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {records.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                              暂无佣金记录
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 提现记录标签页 */}
            {activeTab === 'withdrawals' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Withdrawal Records</h3>
                  <button
                    onClick={() => setShowWithdrawalModal(true)}
                    disabled={!account?.available_balance || parseFloat(account.available_balance) <= 0}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Apply Withdrawal
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Withdrawal Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applied Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {withdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {withdrawal.withdrawal_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(withdrawal.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {withdrawal.method === 'bank_transfer' ? 'Bank Transfer' : 
                             withdrawal.method === 'paypal' ? 'PayPal' :
                             withdrawal.method === 'alipay' ? 'Alipay' : 'WeChat Pay'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm ${getStatusColor(withdrawal.status)}`}>
                              {getStatusText(withdrawal.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(withdrawal.applied_at)}
                          </td>
                        </tr>
                      ))}
                      {withdrawals.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            No withdrawal records yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 提现申请模态框 */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Apply Withdrawal</h3>
              <button
                onClick={() => setShowWithdrawalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleWithdrawalSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  max={account?.available_balance || 0}
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter withdrawal amount"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Available balance: {formatCurrency(account?.available_balance)}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Method
                </label>
                <select
                  value={withdrawalForm.method}
                  onChange={(e) => setWithdrawalForm({...withdrawalForm, method: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="alipay">Alipay</option>
                  <option value="wechat">WeChat Pay</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Information
                </label>
                {withdrawalForm.method === 'bank_transfer' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Bank Name"
                      value={withdrawalForm.accountInfo.bankName}
                      onChange={(e) => setWithdrawalForm({
                        ...withdrawalForm,
                        accountInfo: {...withdrawalForm.accountInfo, bankName: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={withdrawalForm.accountInfo.accountNumber}
                      onChange={(e) => setWithdrawalForm({
                        ...withdrawalForm,
                        accountInfo: {...withdrawalForm.accountInfo, accountNumber: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Account Name"
                      value={withdrawalForm.accountInfo.accountName}
                      onChange={(e) => setWithdrawalForm({
                        ...withdrawalForm,
                        accountInfo: {...withdrawalForm.accountInfo, accountName: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                )}
                {withdrawalForm.method !== 'bank_transfer' && (
                  <input
                    type="text"
                    placeholder={`Enter ${
                      withdrawalForm.method === 'paypal' ? 'PayPal Email' :
                      withdrawalForm.method === 'alipay' ? 'Alipay Account' : 'WeChat ID'
                    }`}
                    value={withdrawalForm.accountInfo.accountNumber}
                    onChange={(e) => setWithdrawalForm({
                      ...withdrawalForm,
                      accountInfo: {...withdrawalForm.accountInfo, accountNumber: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowWithdrawalModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionPage;