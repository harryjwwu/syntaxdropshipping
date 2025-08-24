import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  DollarSign, 
  Package,
  User,
  MapPin,
  ShoppingCart,
  Tag,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { userSettlementAPI } from '../utils/api';
import toast from 'react-hot-toast';

const SettlementDetailPage = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [orders, setOrders] = useState([]);

  // 获取结算详情
  const fetchSettlementDetail = async () => {
    try {
      setLoading(true);
      const response = await userSettlementAPI.getRecordDetail(recordId);
      
      if (response.data.success) {
        setRecord(response.data.data.record);
        setOrders(response.data.data.orders);
      } else {
        toast.error(response.data.message || '获取结算详情失败');
        navigate('/settlement');
      }
    } catch (error) {
      console.error('获取结算详情失败:', error);
      toast.error('获取结算详情失败');
      navigate('/settlement');
    } finally {
      setLoading(false);
    }
  };

  // 格式化金额
  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  // 获取状态样式
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
      case 'settled':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'cancel':
        return 'bg-red-100 text-red-800';
      case 'calculated':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态文本
  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      case 'settled':
        return 'Settled';
      case 'waiting':
        return 'Waiting';
      case 'cancel':
        return 'Cancelled';
      case 'calculated':
        return 'Calculated';
      default:
        return status || 'Unknown';
    }
  };

  // 解析备注信息
  const parseRemark = (remark) => {
    if (!remark) return null;
    
    try {
      const parsed = JSON.parse(remark);
      return {
        customer_remark: parsed.customer_remark || '',
        picking_remark: parsed.picking_remark || '',
        order_remark: parsed.order_remark || ''
      };
    } catch {
      return { general: remark };
    }
  };

  // 渲染备注信息
  const renderRemarks = (order) => {
    const remarks = parseRemark(order.remark);
    const settleRemark = order.settle_remark;
    
    if (!remarks && !settleRemark) {
      return <span className="text-gray-400">No remarks</span>;
    }

    return (
      <div className="space-y-1">
        {remarks && remarks.general && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">General:</span> {remarks.general}
          </div>
        )}
        {remarks && remarks.customer_remark && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Customer:</span> {remarks.customer_remark}
          </div>
        )}
        {remarks && remarks.picking_remark && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Picking:</span> {remarks.picking_remark}
          </div>
        )}
        {remarks && remarks.order_remark && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Order:</span> {remarks.order_remark}
          </div>
        )}
        {settleRemark && (
          <div className="text-xs text-blue-600">
            <span className="font-medium">Settlement:</span> {settleRemark}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (recordId) {
      fetchSettlementDetail();
    }
  }, [recordId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading settlement details...</p>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Settlement Record Not Found</h2>
          <p className="text-gray-600 mb-4">The settlement record you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/settlement')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settlement
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮和标题 */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/settlement')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settlement
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settlement Details</h1>
          <p className="text-gray-600">Settlement ID: {record.id}</p>
        </div>
      </div>

      {/* 结算记录信息 */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Settlement Period</p>
              <p className="text-lg font-semibold text-gray-900">
                {record.start_settlement_date} to {record.end_settlement_date}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-lg font-semibold text-gray-900">
                ¥{formatAmount(record.total_settlement_amount)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Package className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Order Count</p>
              <p className="text-lg font-semibold text-gray-900">{record.order_count}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(record.status)}`}>
                {getStatusText(record.status)}
              </span>
            </div>
          </div>
        </div>

        {record.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start">
              <MessageSquare className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
                <p className="text-gray-700">{record.notes}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 订单列表 */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Settlement Orders</h2>
          <p className="text-sm text-gray-600 mt-1">
            {orders.length} orders included in this settlement
          </p>
        </div>

        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    {/* 订单信息 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-start">
                        <ShoppingCart className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">#{order.dxm_order_id}</div>
                          <div className="text-gray-500">ID: {order.order_id}</div>
                          <div className="text-gray-400 text-xs">
                            {new Date(order.payment_time).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 买家信息 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-start">
                        <User className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{order.buyer_name}</div>
                          <div className="text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {order.country_code}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 产品信息 */}
                    <td className="px-4 py-4">
                      <div className="flex items-start">
                        <Package className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 max-w-xs truncate" title={order.product_name}>
                            {order.product_name}
                          </div>
                          <div className="text-gray-500">
                            <Tag className="w-3 h-3 inline mr-1" />
                            SKU: {order.product_sku}
                          </div>
                          <div className="text-gray-500">
                            SPU: {order.product_spu}
                          </div>
                          <div className="text-gray-400 text-xs">
                            Qty: {order.product_count}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 价格信息 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-start">
                        <CreditCard className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            ¥{formatAmount(order.unit_price)}
                          </div>
                          <div className="text-gray-500">
                            Total: ¥{formatAmount(order.multi_total_price)}
                          </div>
                          {order.discount > 0 && (
                            <div className="text-red-600 text-xs">
                              Discount: -¥{formatAmount(order.discount)}
                            </div>
                          )}
                          <div className="text-green-600 font-medium text-xs">
                            Settlement: ¥{formatAmount(order.settlement_amount)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 状态信息 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Order Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(order.order_status)}`}>
                            {getStatusText(order.order_status)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Settlement Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(order.settlement_status)}`}>
                            {getStatusText(order.settlement_status)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 备注信息 */}
                    <td className="px-4 py-4">
                      <div className="flex items-start">
                        <MessageSquare className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                        <div className="text-sm max-w-xs">
                          {renderRemarks(order)}
                        </div>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-500">No orders are associated with this settlement record.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementDetailPage;
