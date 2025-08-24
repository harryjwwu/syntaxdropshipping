import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Globe, 
  DollarSign,
  Calendar,
  Info,
  Truck,
  Weight,
  MapPin
} from 'lucide-react';
import { quotesAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const QuoteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  // 获取报价详情
  const fetchQuoteDetail = async () => {
    try {
      setLoading(true);
      const response = await quotesAPI.getQuoteDetail(id);
      setQuote(response.data);
    } catch (error) {
      console.error('获取报价详情失败:', error);
      toast.error('获取报价详情失败');
      // 如果报价不存在或无权限，返回报价列表
      navigate('/quotes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchQuoteDetail();
    }
  }, [id]);

  // 格式化价格
  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  // 格式化日期
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化物流方式
  const formatLogisticsMethods = (methods) => {
    if (!methods) return '暂无信息';
    try {
      const methodsArray = JSON.parse(methods);
      return methodsArray.join(', ');
    } catch (e) {
      return methods;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">报价不存在</h3>
            <p className="mt-1 text-sm text-gray-500">
              该报价可能已被删除或您没有权限查看
            </p>
            <div className="mt-6">
              <Link
                to="/quotes"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回报价列表
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/quotes')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">报价详情</h1>
                <p className="mt-2 text-gray-600">查看SPU产品的详细报价信息</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 产品信息卡片 */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  产品信息
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    {quote.spu_photo ? (
                      <img
                        className="h-24 w-24 rounded-lg object-cover border border-gray-200 shadow-sm"
                        src={quote.spu_photo}
                        alt={quote.spu_name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="h-24 w-24 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 shadow-sm"
                      style={{ display: quote.spu_photo ? 'none' : 'flex' }}
                    >
                      <Package className="h-10 w-10 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">
                      {quote.spu_name}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">SPU编号:</span> {quote.spu}
                      </div>
                      <div>
                        <span className="font-medium">数量:</span> {quote.quantity}
                      </div>
                      {quote.weight && (
                        <div className="flex items-center">
                          <Weight className="h-4 w-4 mr-1" />
                          <span className="font-medium">重量:</span> {quote.weight}kg
                        </div>
                      )}
                      {quote.logistics_methods && (
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 mr-1" />
                          <span className="font-medium">物流方式:</span> {formatLogisticsMethods(quote.logistics_methods)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 目的地信息卡片 */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-green-600" />
                  目的地信息
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {quote.country_name_cn || quote.country_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        国家代码: {quote.country_code}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Package className="h-5 w-5 mr-2 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">
                        数量: {quote.quantity}
                      </div>
                      <div className="text-sm text-gray-500">
                        单位: 件
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 时间信息卡片 */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                  时间信息
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">创建时间:</span>
                    <div className="text-gray-600 mt-1">
                      {formatDate(quote.created_at)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">更新时间:</span>
                    <div className="text-gray-600 mt-1">
                      {formatDate(quote.updated_at)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 价格信息侧边栏 */}
          <div className="space-y-6">
            {/* 价格明细卡片 */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                  价格明细
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* 成本明细 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">产品成本</span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(quote.product_cost)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">运输费用</span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(quote.shipping_cost)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">包装费用</span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(quote.packing_cost)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">税费</span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(quote.vat_cost)}
                      </span>
                    </div>
                  </div>

                  {/* 总价 */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">总价</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatPrice(quote.total_price)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      单价: {formatPrice(quote.total_price / quote.quantity)} / 件
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="space-y-3">
                  <Link
                    to="/quotes"
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    返回报价列表
                  </Link>
                  
                  <button
                    onClick={() => window.print()}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Info className="mr-2 h-4 w-4" />
                    打印报价单
                  </button>
                </div>
              </div>
            </div>

            {/* 备注信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-blue-800 font-medium mb-1">报价说明</p>
                  <p className="text-blue-700">
                    此报价仅供参考，实际价格可能因市场变化而调整。如有疑问，请联系客服。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetailPage;
