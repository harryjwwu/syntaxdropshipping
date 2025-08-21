import React, { useState } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Calendar, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  FileText,
  RefreshCw
} from 'lucide-react';
import { adminAPI } from '../utils/api';

const SettlementPage = () => {
  const [activeTab, setActiveTab] = useState('calculate');
  const [loading, setLoading] = useState(false);
  const [calculateForm, setCalculateForm] = useState({
    startDate: '',
    endDate: '',
    dxm_client_id: ''
  });
  const [manageForm, setManageForm] = useState({
    startDate: '',
    endDate: '',
    dxm_client_id: ''
  });
  const [calculateResult, setCalculateResult] = useState(null);
  const [ordersList, setOrdersList] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [settlementRecords, setSettlementRecords] = useState([]);

  // 获取昨天的日期作为最大可选日期
  const getMaxDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  // 手动触发结算计算
  const handleCalculateSettlement = async (e) => {
    e.preventDefault();
    if (!calculateForm.startDate || !calculateForm.endDate) {
      alert('请选择开始日期和结束日期');
      return;
    }
    
    if (new Date(calculateForm.startDate) > new Date(calculateForm.endDate)) {
      alert('开始日期不能晚于结束日期');
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.calculateSettlement({
        startDate: calculateForm.startDate,
        endDate: calculateForm.endDate,
        dxm_client_id: calculateForm.dxm_client_id || undefined
      });

      setCalculateResult(response.data);
    } catch (error) {
      console.error('结算计算失败:', error);
      alert(error.response?.data?.message || '结算计算失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取结算订单列表
  const handleGetSettlementOrders = async (e) => {
    e.preventDefault();
    if (!manageForm.startDate || !manageForm.endDate || !manageForm.dxm_client_id) {
      alert('请选择开始日期、结束日期和输入客户ID');
      return;
    }
    
    if (new Date(manageForm.startDate) > new Date(manageForm.endDate)) {
      alert('开始日期不能晚于结束日期');
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.getSettlementOrders({
        startDate: manageForm.startDate,
        endDate: manageForm.endDate,
        dxm_client_id: manageForm.dxm_client_id
      });

      setOrdersList(response.data);
    } catch (error) {
      console.error('获取订单列表失败:', error);
      alert(error.response?.data?.message || '获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 执行结算收款
  const handleExecuteSettlement = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.executeSettlement({
        startDate: manageForm.startDate,
        endDate: manageForm.endDate,
        dxm_client_id: parseInt(manageForm.dxm_client_id)
      });

      alert(`结算执行成功！结算记录ID: ${response.data.settlementRecordId}`);
      setShowConfirmModal(false);
      // 重新获取订单列表
      await handleGetSettlementOrders({ preventDefault: () => {} });
      // 刷新结算记录列表
      await fetchSettlementRecords();
    } catch (error) {
      console.error('执行结算失败:', error);
      alert(error.response?.data?.message || '执行结算失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取结算记录列表
  const fetchSettlementRecords = async () => {
    try {
      const response = await adminAPI.getSettlementRecords();
      setSettlementRecords(response.data || []);
    } catch (error) {
      console.error('获取结算记录失败:', error);
    }
  };

  // 跳转到结算记录详情页面
  const handleViewSettlementDetail = (record) => {
    window.location.href = `/settlement/records/${record.id}`;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">结算管理</h1>
          <p className="text-gray-600 mt-1">管理订单结算计算和收款确认</p>
        </div>
      </div>

      {/* 功能选项卡 */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('calculate')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'calculate'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calculator className="w-4 h-4 inline mr-2" />
              手动触发结算计算
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              开始结算
            </button>
            <button
              onClick={() => {
                setActiveTab('records');
                fetchSettlementRecords();
              }}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'records'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              结算列表
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* 手动触发结算计算 */}
          {activeTab === 'calculate' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Calculator className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">手动触发结算计算</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      选择日期范围并可选择特定客户进行结算计算。注意：结束日期仅支持前一天的日期，不能选择当天。
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCalculateSettlement} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      开始日期 *
                    </label>
                    <input
                      type="date"
                      value={calculateForm.startDate}
                      onChange={(e) => setCalculateForm(prev => ({
                        ...prev,
                        startDate: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      结束日期 *
                    </label>
                    <input
                      type="date"
                      value={calculateForm.endDate}
                      max={getMaxDate()}
                      onChange={(e) => setCalculateForm(prev => ({
                        ...prev,
                        endDate: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">仅支持前一天的日期</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      客户ID (可选)
                    </label>
                    <input
                      type="number"
                      value={calculateForm.dxm_client_id}
                      onChange={(e) => setCalculateForm(prev => ({
                        ...prev,
                        dxm_client_id: e.target.value
                      }))}
                      placeholder="留空则计算所有客户"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Calculator className="w-4 h-4 mr-2" />
                  )}
                  {loading ? '计算中...' : '开始计算'}
                </button>
              </form>

              {/* 计算结果 */}
              {calculateResult && (
                <div className="space-y-4">
                  <div className={`border rounded-lg p-4 ${
                    calculateResult.settledOrders > 0 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <h3 className={`text-lg font-medium mb-3 ${
                      calculateResult.settledOrders > 0 
                        ? 'text-green-800' 
                        : 'text-yellow-800'
                    }`}>
                      <CheckCircle className="w-5 h-5 inline mr-2" />
                      结算计算完成
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">处理订单:</span>
                        <span className="font-medium ml-2">{calculateResult.processedOrders}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">成功结算:</span>
                        <span className={`font-medium ml-2 ${
                          calculateResult.settledOrders > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>{calculateResult.settledOrders}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">跳过订单:</span>
                        <span className={`font-medium ml-2 ${
                          calculateResult.skippedOrders > 0 ? 'text-yellow-600' : 'text-gray-600'
                        }`}>{calculateResult.skippedOrders}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">处理时间:</span>
                        <span className="font-medium ml-2">{calculateResult.processingTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* 详细的失败原因分析 */}
                  {calculateResult.skippedOrders > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-md font-medium text-red-800 mb-3">
                        <AlertTriangle className="w-4 h-4 inline mr-2" />
                        无法结算原因分析
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="bg-white rounded p-3">
                          <h5 className="font-medium text-red-700 mb-2">主要问题：缺少价格或折扣信息</h5>
                          <div className="space-y-1 text-red-600">
                            <p>• <strong>单件价格为0</strong>：订单缺少unit_price信息 
                              {calculateResult.failureReasons?.noPriceInfo > 0 && 
                                <span className="ml-1 text-xs bg-red-100 px-1 rounded">({calculateResult.failureReasons.noPriceInfo}个)</span>
                              }
                            </p>
                            <p>• <strong>折扣信息异常</strong>：discount值可能不正确
                              {calculateResult.failureReasons?.noDiscountInfo > 0 && 
                                <span className="ml-1 text-xs bg-red-100 px-1 rounded">({calculateResult.failureReasons.noDiscountInfo}个)</span>
                              }
                            </p>
                            <p>• <strong>价格计算错误</strong>：其他价格计算问题
                              {calculateResult.failureReasons?.priceCalculationError > 0 && 
                                <span className="ml-1 text-xs bg-red-100 px-1 rounded">({calculateResult.failureReasons.priceCalculationError}个)</span>
                              }
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 rounded p-3">
                          <h5 className="font-medium text-blue-700 mb-2">解决方案：</h5>
                          <div className="space-y-1 text-blue-600 text-xs">
                            <p>1. <strong>检查SPU报价管理</strong>：确保相关产品的SPU已设置报价</p>
                            <p>2. <strong>检查用户折扣规则</strong>：确保客户已配置折扣规则</p>
                            <p>3. <strong>检查产品SKU映射</strong>：确保产品SKU正确映射到SPU</p>
                            <p>4. <strong>重新导入订单数据</strong>：如果数据不完整，考虑重新导入</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {calculateResult.errors && calculateResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-600 font-medium mb-2">详细错误信息:</p>
                      <div className="max-h-32 overflow-y-auto">
                        <ul className="text-red-600 text-xs space-y-1">
                          {calculateResult.errors.slice(0, 10).map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                          {calculateResult.errors.length > 10 && (
                            <li className="text-red-500">... 还有 {calculateResult.errors.length - 10} 个错误</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 开始结算 */}
          {activeTab === 'manage' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <DollarSign className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">开始结算</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      选择日期范围和指定客户查看结算订单，确认无异常后可执行结算收款。
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleGetSettlementOrders} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      开始日期 *
                    </label>
                    <input
                      type="date"
                      value={manageForm.startDate}
                      onChange={(e) => setManageForm(prev => ({
                        ...prev,
                        startDate: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      结束日期 *
                    </label>
                    <input
                      type="date"
                      value={manageForm.endDate}
                      max={getMaxDate()}
                      onChange={(e) => setManageForm(prev => ({
                        ...prev,
                        endDate: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">仅支持前一天的日期</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      客户ID *
                    </label>
                    <input
                      type="number"
                      value={manageForm.dxm_client_id}
                      onChange={(e) => setManageForm(prev => ({
                        ...prev,
                        dxm_client_id: e.target.value
                      }))}
                      placeholder="请输入客户ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  {loading ? '查询中...' : '查询订单'}
                </button>
              </form>

              {/* 订单列表和结算信息 */}
              {ordersList && (
                <div className="space-y-4">
                  {/* 结算摘要 */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">结算摘要</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">总订单数:</span>
                        <span className="font-medium ml-2">{ordersList.summary.totalOrders}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">等待计算:</span>
                        <span className="font-medium ml-2 text-yellow-600">{ordersList.summary.waitingOrders}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">已计算:</span>
                        <span className="font-medium ml-2 text-green-600">{ordersList.summary.calculatedOrders}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">结算金额:</span>
                        <span className="font-medium ml-2 text-blue-600">¥{ordersList.summary.totalSettlementAmount}</span>
                      </div>
                    </div>

                    {/* 状态提示 */}
                    {ordersList.summary.waitingOrders > 0 ? (
                      <div className="mt-4 flex items-center text-yellow-700 bg-yellow-100 px-3 py-2 rounded-md">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        存在 {ordersList.summary.waitingOrders} 个等待计算的订单，请先完成结算计算
                      </div>
                    ) : ordersList.summary.calculatedOrders > 0 ? (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center text-green-700 bg-green-100 px-3 py-2 rounded-md">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          可以执行结算收款
                        </div>
                        <button
                          onClick={() => setShowConfirmModal(true)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          执行结算
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center text-gray-600 bg-gray-100 px-3 py-2 rounded-md">
                        <Clock className="w-4 h-4 mr-2" />
                        没有可结算的订单
                      </div>
                    )}
                  </div>

                  {/* 订单列表 */}
                  {ordersList.orders.all.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">订单详情</h3>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                订单信息
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                商品信息
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                结算信息
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                状态
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {ordersList.orders.all.map((order, index) => (
                              <tr key={`${order._tableName}-${order.id}`} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">#{order.dxm_order_id}</div>
                                    <div className="text-gray-500">{order.buyer_name}</div>
                                    <div className="text-gray-500">{new Date(order.payment_time).toLocaleString()}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">{order.product_name}</div>
                                    <div className="text-gray-500">SKU: {order.product_sku}</div>
                                    <div className="text-gray-500">数量: {order.product_count}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="text-sm">
                                    <div className="font-medium text-gray-900">
                                      ¥{parseFloat(order.settlement_amount || 0).toFixed(2)}
                                    </div>
                                    {order.settle_remark && (
                                      <div className="text-gray-500 text-xs">{order.settle_remark}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    order.settlement_status === 'waiting' 
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : order.settlement_status === 'calculated'
                                      ? 'bg-green-100 text-green-800'
                                      : order.settlement_status === 'settled'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {order.settlement_status === 'waiting' && '等待计算'}
                                    {order.settlement_status === 'calculated' && '已计算'}
                                    {order.settlement_status === 'settled' && '已结算'}
                                    {order.settlement_status === 'cancel' && '已取消'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 结算列表 */}
          {activeTab === 'records' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">结算列表</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      查看已完成的结算记录，点击记录可查看详细的订单列表。
                    </p>
                  </div>
                </div>
              </div>

              {/* 结算记录列表 */}
              {settlementRecords.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">结算记录</h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            结算记录ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            客户信息
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            结算信息
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            状态
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {settlementRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">{record.id}</div>
                                <div className="text-gray-500">{new Date(record.created_at).toLocaleString()}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">客户ID: {record.dxm_client_id}</div>
                                <div className="text-gray-500">
                                  结算周期: {record.start_settlement_date} 至 {record.end_settlement_date}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  ¥{parseFloat(record.total_settlement_amount || 0).toFixed(2)}
                                </div>
                                <div className="text-gray-500">{record.order_count} 个订单</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                record.status === 'completed' 
                                  ? 'bg-green-100 text-green-800'
                                  : record.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {record.status === 'completed' && '已完成'}
                                {record.status === 'pending' && '处理中'}
                                {record.status === 'cancelled' && '已取消'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleViewSettlementDetail(record)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                查看详情
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">暂无结算记录</p>
                  <p className="text-gray-400 text-sm mt-1">完成结算后记录将显示在这里</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>



      {/* 确认结算模态框 */}
      {showConfirmModal && ordersList && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 text-center">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowConfirmModal(false)} />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">确认执行结算</h3>
              
              <div className="text-sm text-gray-600 space-y-2 mb-6">
                <p>开始日期: <span className="font-medium">{manageForm.startDate}</span></p>
                <p>结束日期: <span className="font-medium">{manageForm.endDate}</span></p>
                <p>客户ID: <span className="font-medium">{manageForm.dxm_client_id}</span></p>
                <p>订单数量: <span className="font-medium">{ordersList.summary.calculatedOrders}</span></p>
                <p>结算金额: <span className="font-medium text-green-600">¥{ordersList.summary.totalSettlementAmount}</span></p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  onClick={handleExecuteSettlement}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? '执行中...' : '确认结算'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettlementPage;
