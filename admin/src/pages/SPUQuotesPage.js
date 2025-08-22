import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, DollarSign, Globe, Package, Filter, X, Copy } from 'lucide-react';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

const SPUQuotesPage = () => {
  const [quotes, setQuotes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  // 从localStorage获取上次的客户ID
  const getLastClientId = () => {
    try {
      return localStorage.getItem('spu_quotes_last_client_id') || '';
    } catch (error) {
      return '';
    }
  };
  
  // 保存客户ID到localStorage
  const saveLastClientId = (clientId) => {
    try {
      if (clientId && clientId.trim()) {
        localStorage.setItem('spu_quotes_last_client_id', clientId.trim());
      }
    } catch (error) {
      console.warn('无法保存客户ID到localStorage:', error);
    }
  };
  
  // 搜索输入框的即时状态
  const [filterInputs, setFilterInputs] = useState({
    spu: '',
    dxm_client_id: getLastClientId(),
    country_code: '',
    quantity: ''
  });
  // 实际搜索的状态
  const [filters, setFilters] = useState({
    spu: '',
    dxm_client_id: getLastClientId(),
    country_code: '',
    quantity: ''
  });
  
  const navigate = useNavigate();

  // 获取报价列表
  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await adminAPI.getSpuQuotes(params);
      setQuotes(response.data || []);
      setPagination(response.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      });
    } catch (error) {
      console.error('获取报价列表失败:', error);
      toast.error('获取报价列表失败');
    } finally {
      setLoading(false);
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

  // 初始加载
  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [pagination.page, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // 页面加载时，如果有缓存的客户ID，自动执行搜索
  useEffect(() => {
    const cachedClientId = getLastClientId();
    if (cachedClientId) {
      console.log('🔄 检测到缓存的客户ID，自动执行搜索:', cachedClientId);
    }
  }, []); // 只在组件挂载时执行一次

  // 输入框变化处理（只更新输入状态，不触发搜索）
  const handleInputChange = (key, value) => {
    setFilterInputs(prev => ({ ...prev, [key]: value }));
    
    // 如果是客户ID字段，保存到localStorage
    if (key === 'dxm_client_id') {
      saveLastClientId(value);
    }
  };

  // 执行搜索
  const handleSearch = () => {
    setFilters(filterInputs);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 重置搜索
  const handleResetSearch = () => {
    const emptyFilters = {
      spu: '',
      dxm_client_id: '',
      country_code: '',
      quantity: ''
    };
    setFilterInputs(emptyFilters);
    setFilters(emptyFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // 清空客户ID缓存
    try {
      localStorage.removeItem('spu_quotes_last_client_id');
    } catch (error) {
      console.warn('清空客户ID缓存失败:', error);
    }
  };

  // 移除单个搜索条件
  const handleRemoveFilter = (filterKey) => {
    const newFilterInputs = { ...filterInputs, [filterKey]: '' };
    const newFilters = { ...filters, [filterKey]: '' };
    
    setFilterInputs(newFilterInputs);
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // 如果移除的是客户ID筛选，清空客户ID缓存
    if (filterKey === 'dxm_client_id') {
      try {
        localStorage.removeItem('spu_quotes_last_client_id');
      } catch (error) {
        console.warn('清空客户ID缓存失败:', error);
      }
    }
  };

  // 搜索输入框回车处理
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 分页处理
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // 删除报价
  const handleDeleteQuote = async (id) => {
    if (!window.confirm('确定要删除这条报价吗？此操作不可撤销。')) {
      return;
    }

    try {
      await adminAPI.deleteSpuQuote(id);
      toast.success('报价删除成功');
      fetchQuotes();
    } catch (error) {
      console.error('删除报价失败:', error);
      toast.error(error.response?.data?.message || '删除报价失败');
    }
  };

  // 编辑报价
  const handleEditQuote = (id) => {
    navigate(`/spu-quotes/${id}/edit`);
  };

  // 新增报价
  const handleCreateQuote = () => {
    navigate('/spu-quotes/new');
  };

  // 复制报价
  const handleCopyQuote = (quote) => {
    // 构建复制的数据，排除ID和时间戳
    const copyData = {
      spu: quote.spu,
      dxm_client_id: quote.dxm_client_id,
      country_code: quote.country_code,
      product_cost: quote.product_cost,
      shipping_cost: quote.shipping_cost,
      packing_cost: quote.packing_cost,
      vat_cost: quote.vat_cost,
      quantity: quote.quantity,
      total_price: quote.total_price
    };
    
    // 通过state传递复制的数据到新增页面
    navigate('/spu-quotes/new', { 
      state: { 
        copyData,
        isCopy: true 
      } 
    });
  };

  // 批量操作
  const handleBatchCreate = () => {
    navigate('/spu-quotes/batch');
  };

  // 格式化货币
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // 获取国家名称
  const getCountryName = (code) => {
    const country = countries.find(c => c.code === code);
    return country ? `${country.name_cn || country.name} (${code})` : code;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SPU报价管理</h1>
          <p className="text-slate-600">管理SPU在不同国家和数量的报价</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleBatchCreate}
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Package className="h-4 w-4 mr-2" />
            批量录入
          </button>
          <button
            onClick={handleCreateQuote}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            新增报价
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label htmlFor="dxm_client_id" className="block text-sm font-medium text-slate-700 mb-2">
              客户ID
            </label>
            <input
              id="dxm_client_id"
              type="text"
              value={filterInputs.dxm_client_id}
              onChange={(e) => handleInputChange('dxm_client_id', e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="输入客户ID"
            />
          </div>
          
          <div>
            <label htmlFor="spu" className="block text-sm font-medium text-slate-700 mb-2">
              SPU编号
            </label>
            <input
              id="spu"
              type="text"
              value={filterInputs.spu}
              onChange={(e) => handleInputChange('spu', e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="输入SPU编号"
            />
          </div>
          
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-2">
              国家
            </label>
            <select
              id="country"
              value={filterInputs.country_code}
              onChange={(e) => handleInputChange('country_code', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">全部国家</option>
              {(countries || []).map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name_cn || country.name} ({country.code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-2">
              数量
            </label>
            <input
              id="quantity"
              type="number"
              value={filterInputs.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="输入数量"
              min="1"
            />
          </div>
          
          <div className="flex items-end space-x-2">
            <button
              onClick={handleSearch}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Search className="h-4 w-4 mr-2" />
              搜索
            </button>
            <button
              onClick={handleResetSearch}
              className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              重置
            </button>
          </div>
          
          <div className="flex items-end">
            <div className="text-sm text-slate-600">
              共找到 {pagination.total} 条报价
            </div>
          </div>
        </div>
        
        {/* 当前搜索条件显示 */}
        {(filters.spu || filters.dxm_client_id || filters.country_code || filters.quantity) && (
          <div className="mt-4 flex items-center space-x-4 text-sm text-slate-600">
            <span>当前搜索条件：</span>
            {filters.dxm_client_id && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 group">
                客户ID: {filters.dxm_client_id}
                <button
                  onClick={() => handleRemoveFilter('dxm_client_id')}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-200 text-indigo-600 hover:bg-indigo-300 hover:text-indigo-800 transition-colors"
                  title="移除客户ID筛选"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.spu && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 group">
                SPU: {filters.spu}
                <button
                  onClick={() => handleRemoveFilter('spu')}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-200 text-green-600 hover:bg-green-300 hover:text-green-800 transition-colors"
                  title="移除SPU筛选"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.country_code && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800 group">
                国家: {getCountryName(filters.country_code)}
                <button
                  onClick={() => handleRemoveFilter('country_code')}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-200 text-purple-600 hover:bg-purple-300 hover:text-purple-800 transition-colors"
                  title="移除国家筛选"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.quantity && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 text-orange-800 group">
                数量: {filters.quantity}
                <button
                  onClick={() => handleRemoveFilter('quantity')}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-200 text-orange-600 hover:bg-orange-300 hover:text-orange-800 transition-colors"
                  title="移除数量筛选"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 报价列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  客户ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  SPU信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  国家/数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  产品成本
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  运费
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  包装费
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  税费
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  总价
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  更新时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {(quotes || []).map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{quote.dxm_client_id}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-slate-400 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900 truncate">{quote.spu}</div>
                        <div className="text-sm text-slate-500 truncate" title={quote.spu_name}>
                          {quote.spu_name && quote.spu_name.length > 30 
                            ? `${quote.spu_name.substring(0, 30)}...` 
                            : quote.spu_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-slate-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {getCountryName(quote.country_code)}
                        </div>
                        <div className="text-sm text-slate-500">数量: {quote.quantity}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {formatCurrency(quote.product_cost)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {formatCurrency(quote.shipping_cost)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {formatCurrency(quote.packing_cost)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {formatCurrency(quote.vat_cost)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-primary-600">
                      {formatCurrency(quote.total_price)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(quote.updated_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopyQuote(quote)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                        title="复制报价"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        复制
                      </button>
                      <button
                        onClick={() => handleEditQuote(quote.id)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                        title="编辑报价"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                        title="删除报价"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  显示第 <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> 到{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  条，共 <span className="font-medium">{pagination.total}</span> 条记录
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">
                    第 {pagination.page} 页，共 {pagination.pages} 页
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 空状态 */}
      {!loading && quotes.length === 0 && (
        <div className="text-center py-12">
          {/* 区分无数据和搜索无结果 */}
          {(filters.spu || filters.dxm_client_id || filters.country_code || filters.quantity) ? (
            // 搜索无结果
            <>
              <Search className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">搜索无结果</h3>
              <p className="mt-1 text-sm text-slate-500">没有找到符合条件的SPU报价，请尝试其他搜索条件</p>
              <div className="mt-6">
                <button
                  onClick={handleResetSearch}
                  className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                >
                  清空搜索条件
                </button>
              </div>
            </>
          ) : (
            // 真正无数据
            <>
              <DollarSign className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">暂无报价</h3>
              <p className="mt-1 text-sm text-slate-500">开始创建您的第一个SPU报价吧</p>
              <div className="mt-6">
                <button
                  onClick={handleCreateQuote}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新增报价
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SPUQuotesPage;
