import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Package, Tag, Image as ImageIcon, Scale, Truck, DollarSign, Globe, Users } from 'lucide-react';
import { adminAPI } from '../utils/api';
import { generateListThumbnailURL } from '../services/cosService';
import toast from 'react-hot-toast';

const SPUDetailPage = () => {
  const [spu, setSpu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const navigate = useNavigate();
  const { spu: spuParam } = useParams();

  useEffect(() => {
    fetchSpuDetail();
    fetchSpuQuotes();
    fetchCountries();
  }, [spuParam]);

  // 获取SPU详情
  const fetchSpuDetail = async () => {
    try {
      console.log('🔍 获取SPU详情:', spuParam);
      setLoading(true);
      const response = await adminAPI.getSpu(spuParam);
      console.log('✅ SPU详情响应:', response);
      setSpu(response.data);
    } catch (error) {
      console.error('❌ 获取SPU详情失败:', error);
      toast.error('获取SPU详情失败: ' + (error.response?.data?.message || error.message));
      // 如果SPU不存在，返回列表页
      navigate('/spus');
    } finally {
      setLoading(false);
    }
  };

  // 获取该SPU的所有报价
  const fetchSpuQuotes = async () => {
    try {
      setQuotesLoading(true);
      const response = await adminAPI.getSpuQuotes({ 
        spu: spuParam,
        limit: 1000 // 获取所有报价
      });
      setQuotes(response.data || []);
    } catch (error) {
      console.error('获取SPU报价失败:', error);
      toast.error('获取SPU报价失败');
    } finally {
      setQuotesLoading(false);
    }
  };

  // 获取国家列表
  const fetchCountries = async () => {
    try {
      const response = await adminAPI.getCountries();
      setCountries(response.data || []);
    } catch (error) {
      console.error('获取国家列表失败:', error);
    }
  };

  // 返回列表
  const handleBack = () => {
    navigate('/spus');
  };

  // 编辑SPU
  const handleEdit = () => {
    navigate(`/spus/${spuParam}/edit`);
  };

  // 删除SPU
  const handleDelete = async () => {
    if (!window.confirm('确定要删除这个SPU吗？此操作不可撤销。')) {
      return;
    }

    try {
      await adminAPI.deleteSpu(spuParam);
      toast.success('SPU删除成功');
      navigate('/spus');
    } catch (error) {
      console.error('删除SPU失败:', error);
      toast.error(error.response?.data?.message || '删除SPU失败');
    }
  };



  // 获取国家名称
  const getCountryName = (code) => {
    const country = countries.find(c => c.code === code);
    return country ? `${country.name_cn || country.name} (${code})` : code;
  };

  // 格式化货币
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // 按客户ID分组报价
  const groupQuotesByClient = (quotes) => {
    const grouped = {};
    quotes.forEach(quote => {
      const clientId = quote.dxm_client_id;
      if (!grouped[clientId]) {
        grouped[clientId] = [];
      }
      grouped[clientId].push(quote);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!spu) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-sm font-medium text-slate-900">SPU不存在</h3>
        <p className="mt-1 text-sm text-slate-500">请检查SPU编号是否正确</p>
        <div className="mt-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">SPU详情</h1>
            <p className="mt-1 text-sm text-slate-500">查看SPU的详细信息和关联的SKU</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            编辑
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            删除
          </button>
        </div>
      </div>

      {/* SPU基本信息 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-900">基本信息</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左侧信息 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">SPU编号</label>
                <div className="mt-1 flex items-center">
                  <Package className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-lg font-semibold text-slate-900">{spu.spu}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700">商品名称</label>
                <div className="mt-1 flex items-center">
                  <Tag className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-sm text-slate-900">{spu.name}</span>
                </div>
              </div>

              {spu.weight && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">重量</label>
                  <div className="mt-1 flex items-center">
                    <Scale className="h-4 w-4 text-slate-400 mr-2" />
                    <span className="text-sm text-slate-900">{parseFloat(spu.weight).toFixed(2)}kg</span>
                  </div>
                </div>
              )}

              {spu.logistics_methods && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">物流方式</label>
                  <div className="mt-1 flex items-center">
                    <Truck className="h-4 w-4 text-slate-400 mr-2" />
                    <span className="text-sm text-slate-900">{spu.logistics_methods}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700">父SPU</label>
                <div className="mt-1">
                  <span className="text-sm text-slate-900">
                    {spu.parent_spu === spu.spu ? '根SPU' : spu.parent_spu || '根SPU'}
                  </span>
                </div>
              </div>
            </div>

            {/* 右侧图片 */}
            <div>
              <label className="block text-sm font-medium text-slate-700">商品图片</label>
              <div className="mt-1">
                {spu.photo ? (
                  <div className="relative inline-block">
                    <img
                      src={generateListThumbnailURL(spu.photo, 200, 75)}
                      alt={spu.name}
                      className="w-48 h-48 object-cover rounded-lg border border-slate-200 cursor-pointer"
                      onClick={() => {
                        // 点击查看大图
                        const modal = document.createElement('div');
                        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                        modal.innerHTML = `
                          <div class="relative max-w-4xl max-h-4xl p-4">
                            <img src="${spu.photo}" alt="${spu.name}" class="max-w-full max-h-full object-contain rounded-lg" />
                            <button class="absolute top-2 right-2 bg-white rounded-full p-2 hover:bg-gray-100" onclick="this.closest('.fixed').remove()">
                              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            </button>
                          </div>
                        `;
                        modal.onclick = (e) => {
                          if (e.target === modal) modal.remove();
                        };
                        document.body.appendChild(modal);
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                    <ImageIcon className="h-12 w-12 text-slate-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 关联SKU */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-900">关联SKU</h2>
        </div>
        <div className="px-6 py-4">
          {spu.skus && spu.skus.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {spu.skus.map((sku, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {sku}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">暂无关联的SKU</p>
          )}
        </div>
      </div>

      {/* 时间信息 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-medium text-slate-900">时间信息</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">创建时间</label>
              <p className="mt-1 text-sm text-slate-900">
                {spu.created_at ? new Date(spu.created_at).toLocaleString() : '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">更新时间</label>
              <p className="mt-1 text-sm text-slate-900">
                {spu.updated_at ? new Date(spu.updated_at).toLocaleString() : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SPU报价信息 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-slate-500 mr-2" />
            <h2 className="text-lg font-medium text-slate-900">SPU报价</h2>
          </div>
        </div>
        
        <div className="px-6 py-4">
          {quotesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">暂无报价</h3>
              <p className="mt-1 text-sm text-slate-500">此SPU暂未设置报价</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupQuotesByClient(quotes)).map(([clientId, clientQuotes]) => (
                <div key={clientId} className="border border-slate-200 rounded-lg">
                  {/* 客户ID标题 */}
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-slate-500 mr-2" />
                        <h3 className="text-lg font-medium text-slate-900">客户ID: {clientId}</h3>
                        <span className="ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {clientQuotes.length} 个报价
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 该客户的报价列表 */}
                  <div className="divide-y divide-slate-200">
                    {clientQuotes.map((quote) => (
                      <div key={quote.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* 国家/数量 */}
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 text-slate-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-slate-900">
                                {getCountryName(quote.country_code)}
                              </div>
                              <div className="text-xs text-slate-500">数量: {quote.quantity}</div>
                            </div>
                          </div>
                          
                          {/* 成本明细 */}
                          <div className="text-sm">
                            <div className="text-slate-700">产品: {formatCurrency(quote.product_cost)}</div>
                            <div className="text-slate-700">运费: {formatCurrency(quote.shipping_cost)}</div>
                          </div>
                          
                          <div className="text-sm">
                            <div className="text-slate-700">包装: {formatCurrency(quote.packing_cost)}</div>
                            <div className="text-slate-700">税费: {formatCurrency(quote.vat_cost)}</div>
                          </div>
                          
                          {/* 总价和时间 */}
                          <div>
                            <div className="text-lg font-bold text-primary-600">
                              {formatCurrency(quote.total_price)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(quote.updated_at).toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SPUDetailPage;
