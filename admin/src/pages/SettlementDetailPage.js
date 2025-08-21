import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { adminAPI } from '../utils/api';

const SettlementDetailPage = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settlementRecord, setSettlementRecord] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettlementDetail();
  }, [recordId]);

  const fetchSettlementDetail = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminAPI.getSettlementRecordDetail(recordId);
      setSettlementRecord(response.data.record);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('获取结算详情失败:', error);
      setError(error.response?.data?.message || '获取结算详情失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">加载结算详情中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/settlement')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回结算管理
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-2">获取结算详情失败</div>
          <div className="text-red-500 text-sm">{error}</div>
          <button
            onClick={fetchSettlementDetail}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!settlementRecord) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/settlement')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回结算管理
          </button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-600">结算记录不存在</div>
          <div className="text-yellow-500 text-sm mt-1">记录ID: {recordId}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/settlement')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回结算管理
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">结算记录详情</h1>
            <p className="text-gray-600 mt-1">结算ID: {settlementRecord.id}</p>
          </div>
        </div>
        
        <button
          onClick={fetchSettlementDetail}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </button>
      </div>

      {/* 结算记录概览 */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">结算概览</h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">客户ID</p>
                  <p className="text-2xl font-bold text-blue-900">{settlementRecord.dxm_client_id}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-600 font-medium">结算金额</p>
                  <p className="text-2xl font-bold text-green-900">
                    ¥{parseFloat(settlementRecord.total_settlement_amount || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">订单数量</p>
                  <p className="text-2xl font-bold text-purple-900">{settlementRecord.order_count}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-gray-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 font-medium">结算日期</p>
                  <p className="text-2xl font-bold text-gray-900">{settlementRecord.settlement_date}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 额外信息 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">创建时间</h3>
              <p className="text-sm text-gray-600">
                <Clock className="w-4 h-4 inline mr-1" />
                {new Date(settlementRecord.created_at).toLocaleString()}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">状态</h3>
              <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
                settlementRecord.status === 'completed' 
                  ? 'bg-green-100 text-green-800'
                  : settlementRecord.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <CheckCircle className="w-4 h-4 mr-1" />
                {settlementRecord.status === 'completed' && '已完成'}
                {settlementRecord.status === 'pending' && '处理中'}
                {settlementRecord.status === 'cancelled' && '已取消'}
              </span>
            </div>
          </div>
          
          {settlementRecord.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">备注</h3>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">
                {settlementRecord.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 订单列表 */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">
                订单详情 ({orders.length} 个订单)
              </h2>
            </div>
            
            <div className="text-sm text-gray-600">
              总结算金额: <span className="font-medium text-green-600">
                ¥{orders.reduce((sum, order) => sum + parseFloat(order.settlement_amount || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    订单信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    买家信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    价格信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    结算金额
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order, index) => (
                  <tr key={`${order._tableName}-${order.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">#{order.dxm_order_id}</div>
                        <div className="text-gray-500">{order.country_code}</div>
                        <div className="text-gray-500">{new Date(order.payment_time).toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{order.buyer_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{order.product_name}</div>
                        <div className="text-gray-500">SKU: {order.product_sku}</div>
                        <div className="text-gray-500">SPU: {order.product_spu || '未设置'}</div>
                        <div className="text-gray-500">数量: {order.product_count}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          单价: ¥{parseFloat(order.unit_price || 0).toFixed(2)}
                        </div>
                        {order.multi_total_price > 0 && (
                          <div className="text-gray-900">
                            多件价: ¥{parseFloat(order.multi_total_price || 0).toFixed(2)}
                          </div>
                        )}
                        {order.discount > 0 && order.discount !== 1 && (
                          <div className="text-blue-600">
                            折扣: {(order.discount * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-green-600">
                          ¥{parseFloat(order.settlement_amount || 0).toFixed(2)}
                        </div>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          已结算
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">该结算记录下没有订单</p>
          </div>
        )}
      </div>

      {/* 统计摘要 */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">结算统计</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
              <div className="text-sm text-gray-600">订单总数</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ¥{orders.reduce((sum, order) => sum + parseFloat(order.settlement_amount || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">结算总金额</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ¥{orders.length > 0 ? (orders.reduce((sum, order) => sum + parseFloat(order.settlement_amount || 0), 0) / orders.length).toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-gray-600">平均订单金额</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {orders.reduce((sum, order) => sum + (order.product_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">商品总数量</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementDetailPage;
