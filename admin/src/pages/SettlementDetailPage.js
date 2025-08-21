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
  const [allOrders, setAllOrders] = useState([]);
  const [error, setError] = useState(null);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    fetchSettlementDetail();
  }, [recordId]);

  const fetchSettlementDetail = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminAPI.getSettlementRecordDetail(recordId);
      setSettlementRecord(response.data.record);
      const allOrdersData = response.data.orders || [];
      setAllOrders(allOrdersData);
      setTotalOrders(allOrdersData.length);
      
      // 设置第一页的订单数据
      paginateOrders(1, allOrdersData);
    } catch (error) {
      console.error('获取结算详情失败:', error);
      setError(error.response?.data?.message || '获取结算详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 分页处理函数
  const paginateOrders = (page, ordersData = allOrders) => {
    const startIndex = (page - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const paginatedOrders = ordersData.slice(startIndex, endIndex);
    setOrders(paginatedOrders);
    setCurrentPage(page);
  };

  // 处理页面变化
  const handlePageChange = (page) => {
    paginateOrders(page);
  };

  // 计算总页数
  const totalPages = Math.ceil(totalOrders / ordersPerPage);

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
                  <p className="text-sm text-gray-600 font-medium">结算周期</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {settlementRecord.start_settlement_date} 至 {settlementRecord.end_settlement_date}
                  </p>
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

      {/* 结算统计 */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">结算统计</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalOrders}</div>
              <div className="text-sm text-gray-600">订单总数</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ¥{allOrders.reduce((sum, order) => sum + parseFloat(order.settlement_amount || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">结算总金额</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ¥{totalOrders > 0 ? (allOrders.reduce((sum, order) => sum + parseFloat(order.settlement_amount || 0), 0) / totalOrders).toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-gray-600">平均订单金额</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {allOrders.reduce((sum, order) => sum + (order.product_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">商品总数量</div>
            </div>
          </div>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">
                订单详情 (第 {currentPage} 页，共 {totalPages} 页，总计 {totalOrders} 个订单)
              </h2>
            </div>
            
            <div className="text-sm text-gray-600">
              当前页结算金额: <span className="font-medium text-green-600">
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    订单信息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    买家信息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    产品信息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    价格信息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态信息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    备注信息
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order, index) => (
                  <tr key={`${order._tableName}-${order.id}`} className="hover:bg-gray-50">
                    {/* 订单信息 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{order.dxm_order_id}
                      </div>
                      <div className="text-sm text-gray-500">
                        客户ID: {order.dxm_client_id}
                      </div>
                      <div className="text-xs text-gray-400">
                        {order.country_code}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(order.payment_time).toLocaleString()}
                      </div>
                    </td>

                    {/* 买家信息 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.buyer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.country_code}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(order.payment_time).toLocaleDateString()}
                      </div>
                    </td>

                    {/* 产品信息 */}
                    <td className="px-4 py-4 max-w-xs">
                      <div className="text-sm text-gray-900 truncate" title={order.product_name}>
                        {order.product_name?.substring(0, 40)}
                        {order.product_name?.length > 40 && '...'}
                      </div>
                      <div className="text-sm text-gray-500">
                        SKU: {order.product_sku || '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        SPU: {order.product_spu || '-'}
                      </div>
                      <div className="text-xs text-blue-600">
                        数量: {order.product_count}
                      </div>
                    </td>

                    {/* 价格信息 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        单件价: ¥{parseFloat(order.unit_price || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        多件总价: ¥{parseFloat(order.multi_total_price || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-orange-600">
                        折扣率: {(parseFloat(order.discount || 0) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        应收结算: ¥{parseFloat(order.settlement_amount || 0).toFixed(2)}
                      </div>
                    </td>

                    {/* 状态信息 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.order_status === '已发货' ? 'bg-green-100 text-green-800' :
                          order.order_status === '已处理' ? 'bg-green-100 text-green-800' :
                          order.order_status === '已审核' ? 'bg-green-100 text-green-800' :
                          order.order_status === '已退款' ? 'bg-red-100 text-red-800' :
                          order.order_status === '未付款' ? 'bg-gray-100 text-gray-800' :
                          order.order_status === '风控中' ? 'bg-red-100 text-red-800' :
                          order.order_status === '待审核' ? 'bg-orange-100 text-orange-800' :
                          order.order_status === '待处理' ? 'bg-blue-100 text-blue-800' :
                          order.order_status === '待打单（有货）' ? 'bg-cyan-100 text-cyan-800' :
                          order.order_status === '待打单（缺货）' ? 'bg-yellow-100 text-yellow-800' :
                          order.order_status === '待打单（异常）' ? 'bg-red-100 text-red-800' :
                          order.order_status === '已忽略' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.order_status}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                          order.settlement_status === 'calculated' ? 'bg-blue-100 text-blue-700' :
                          order.settlement_status === 'settled' ? 'bg-green-100 text-green-700' :
                          order.settlement_status === 'cancel' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.settlement_status === 'waiting' ? '待结算' : 
                           order.settlement_status === 'calculated' ? '已计算结算数据' :
                           order.settlement_status === 'settled' ? '已结算' : '已取消'}
                        </span>
                      </div>
                    </td>

                    {/* 备注信息 */}
                    <td className="px-4 py-4 max-w-xs">
                      {order.remark ? (
                        <div className="text-xs space-y-1">
                          {(() => {
                            try {
                              const remarkObj = JSON.parse(order.remark);
                              return (
                                <>
                                  {remarkObj.customer_remark && (
                                    <div className="text-blue-600">
                                      <span className="font-medium">客服:</span> {remarkObj.customer_remark.substring(0, 30)}
                                      {remarkObj.customer_remark.length > 30 && '...'}
                                    </div>
                                  )}
                                  {remarkObj.picking_remark && (
                                    <div className="text-green-600">
                                      <span className="font-medium">拣货:</span> {remarkObj.picking_remark.substring(0, 30)}
                                      {remarkObj.picking_remark.length > 30 && '...'}
                                    </div>
                                  )}
                                  {remarkObj.order_remark && (
                                    <div className="text-purple-600">
                                      <span className="font-medium">订单:</span> {remarkObj.order_remark.substring(0, 30)}
                                      {remarkObj.order_remark.length > 30 && '...'}
                                    </div>
                                  )}
                                </>
                              );
                            } catch (e) {
                              // 如果不是JSON格式，直接显示原始备注
                              return (
                                <div className="text-gray-600">
                                  {order.remark.substring(0, 50)}
                                  {order.remark.length > 50 && '...'}
                                </div>
                              );
                            }
                          })()}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-xs">无备注</div>
                      )}
                      
                      {order.settle_remark && (
                        <div className="text-xs text-orange-600 mt-2 border-t pt-1">
                          <span className="font-medium">结算说明:</span> 
                          <div className="mt-1">{order.settle_remark.substring(0, 50)}
                          {order.settle_remark.length > 50 && '...'}</div>
                        </div>
                      )}
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
        
        {/* 分页组件 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                显示第 {((currentPage - 1) * ordersPerPage) + 1} 到{' '}
                {Math.min(currentPage * ordersPerPage, totalOrders)} 条，
                共 {totalOrders} 条记录
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                
                {/* 页码按钮 */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm font-medium rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementDetailPage;
