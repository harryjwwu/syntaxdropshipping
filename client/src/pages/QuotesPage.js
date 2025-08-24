import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Eye, 
  Package, 
  Globe, 
  DollarSign,
  TrendingUp,
  BarChart3,
  FileText,
  Weight
} from 'lucide-react';
import { quotesAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const QuotesPage = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [spuList, setSpuList] = useState([]);
  const [countryList, setCountryList] = useState([]);
  
  // 筛选和搜索状态
  const [filters, setFilters] = useState({
    search: '',
    spu: '',
    country_code: '',
    page: 1,
    limit: 20
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // 获取报价列表
  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await quotesAPI.getQuotes(filters);
      setQuotes(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('获取报价列表失败:', error);
      toast.error('获取报价列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await quotesAPI.getQuoteStats();
      setStats(response.data);
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 获取SPU列表
  const fetchSpuList = async () => {
    try {
      const response = await quotesAPI.getSpuList();
      setSpuList(response.data);
    } catch (error) {
      console.error('获取SPU列表失败:', error);
    }
  };

  // 获取国家列表
  const fetchCountryList = async () => {
    try {
      const response = await quotesAPI.getCountryList();
      setCountryList(response.data);
    } catch (error) {
      console.error('获取国家列表失败:', error);
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchStats();
    fetchSpuList();
    fetchCountryList();
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [filters]);

  // 处理搜索
  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  // 处理筛选
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // 清除筛选
  const clearFilters = () => {
    setFilters({
      search: '',
      spu: '',
      country_code: '',
      page: 1,
      limit: 20
    });
  };

  // 格式化价格
  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  // 格式化日期
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (loading && quotes.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">我的报价</h1>
          <p className="mt-2 text-gray-600">查看您的专属SPU产品报价</p>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">总报价数</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total_quotes}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">SPU产品数</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total_spus}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Globe className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">覆盖国家</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total_countries}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">平均价格</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatPrice(stats.avg_price)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 搜索和筛选 */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 搜索框 */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="搜索SPU名称或编号..."
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                </div>

                {/* SPU筛选 */}
                <div>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={filters.spu}
                    onChange={(e) => handleFilterChange('spu', e.target.value)}
                  >
                    <option value="">全部SPU</option>
                    {spuList.map(spu => (
                      <option key={spu.spu} value={spu.spu}>
                        {spu.spu_name} ({spu.quote_count}个报价)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 国家筛选 */}
                <div>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={filters.country_code}
                    onChange={(e) => handleFilterChange('country_code', e.target.value)}
                  >
                    <option value="">全部国家</option>
                    {countryList.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name_cn || country.name} ({country.quote_count}个报价)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  清除筛选
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  搜索
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 报价列表 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              报价列表 ({pagination.total} 条)
            </h3>
          </div>

          {loading ? (
            <div className="p-8">
              <LoadingSpinner />
            </div>
          ) : quotes.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无报价</h3>
              <p className="mt-1 text-sm text-gray-500">
                您还没有任何SPU产品报价
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      产品信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      国家/数量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      成本明细
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      总价
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      更新时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {quote.spu_photo ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                                src={quote.spu_photo}
                                alt={quote.spu_name}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200"
                              style={{ display: quote.spu_photo ? 'none' : 'flex' }}
                            >
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {quote.spu_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {quote.spu}
                            </div>
                            {quote.weight && (
                              <div className="text-xs text-gray-400 mt-1 flex items-center">
                                <Weight className="h-3 w-3 mr-1" />
                                {quote.weight}kg
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {quote.country_name_cn || quote.country_name} ({quote.country_code})
                        </div>
                        <div className="text-sm text-gray-500">
                          数量: {quote.quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>产品: {formatPrice(quote.product_cost)}</div>
                        <div>运费: {formatPrice(quote.shipping_cost)}</div>
                        <div>包装: {formatPrice(quote.packing_cost)}</div>
                        <div>税费: {formatPrice(quote.vat_cost)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-semibold text-green-600">
                          {formatPrice(quote.total_price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(quote.updated_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/quotes/${quote.id}`}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          查看详情
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handleFilterChange('page', Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() => handleFilterChange('page', Math.min(pagination.pages, pagination.page + 1))}
                  disabled={pagination.page === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    显示第 <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> 到{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    条，共 <span className="font-medium">{pagination.total}</span> 条记录
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handleFilterChange('page', Math.max(1, pagination.page - 1))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>
                    {(() => {
                      const currentPage = pagination.page;
                      const totalPages = pagination.pages;
                      const maxVisiblePages = 5;
                      
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                      
                      // 调整起始页，确保显示足够的页码
                      if (endPage - startPage + 1 < maxVisiblePages) {
                        startPage = Math.max(1, endPage - maxVisiblePages + 1);
                      }
                      
                      const pages = [];
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => handleFilterChange('page', i)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              i === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      
                      return pages;
                    })()}
                    <button
                      onClick={() => handleFilterChange('page', Math.min(pagination.pages, pagination.page + 1))}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotesPage;
