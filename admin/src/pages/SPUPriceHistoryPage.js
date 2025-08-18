import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, TrendingUp, TrendingDown, Package, Globe, User, Clock, ArrowUpDown, X } from 'lucide-react';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

const SPUPriceHistoryPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  // 搜索输入框的即时状态
  const [filterInputs, setFilterInputs] = useState({
    spu: searchParams.get('spu') || '',
    country_code: '',
    quantity: '',
    change_type: '',
    start_date: '',
    end_date: ''
  });
  
  // 实际搜索的状态
  const [filters, setFilters] = useState({
    spu: searchParams.get('spu') || '',
    country_code: '',
    quantity: '',
    change_type: '',
    start_date: '',
    end_date: ''
  });
  
  const [countries, setCountries] = useState([]);
  const [stats, setStats] = useState(null);

  // 获取价格历史列表
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await adminAPI.getSpuPriceHistory(params);
      setHistory(response.data.data);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      });
    } catch (error) {
      console.error('获取价格历史失败:', error);
      toast.error('获取价格历史失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取国家列表
  const fetchCountries = async () => {
    try {
      const response = await adminAPI.getCountries();
      setCountries(response.data);
    } catch (error) {
      console.error('获取国家列表失败:', error);
    }
  };

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await adminAPI.getSpuPriceHistoryStats({ days: 30 });
      setStats(response.data.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 初始化
  useEffect(() => {
    fetchCountries();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [pagination.page, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // 输入框变化处理（只更新输入状态，不触发搜索）
  const handleInputChange = (key, value) => {
    setFilterInputs(prev => ({ ...prev, [key]: value }));
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
      country_code: '',
      quantity: '',
      change_type: '',
      start_date: '',
      end_date: ''
    };
    setFilterInputs(emptyFilters);
    setFilters(emptyFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
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

  // 清空筛选（保持兼容性）
  const handleClearFilters = () => {
    handleResetSearch();
  };

  // 移除单个搜索条件
  const handleRemoveFilter = (filterKey) => {
    const newFilterInputs = { ...filterInputs, [filterKey]: '' };
    const newFilters = { ...filters, [filterKey]: '' };
    
    setFilterInputs(newFilterInputs);
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
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

  // 获取变更类型标签
  const getChangeTypeLabel = (type) => {
    const types = {
      create: { label: '创建', color: 'bg-green-100 text-green-800' },
      update: { label: '更新', color: 'bg-blue-100 text-blue-800' },
      delete: { label: '删除', color: 'bg-red-100 text-red-800' }
    };
    return types[type] || { label: type, color: 'bg-slate-100 text-slate-800' };
  };

  // 计算价格变化
  const getPriceChange = (oldPrice, newPrice) => {
    const old = parseFloat(oldPrice);
    const newP = parseFloat(newPrice);
    
    if (old === 0) return { amount: newP, percent: 0, isIncrease: true };
    
    const change = newP - old;
    const percent = (change / old) * 100;
    
    return {
      amount: Math.abs(change),
      percent: Math.abs(percent),
      isIncrease: change > 0
    };
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
          <h1 className="text-2xl font-bold text-slate-900">价格变更历史</h1>
          <p className="text-slate-600">查看SPU报价的所有变更记录</p>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">本月创建</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {stats.totalStats.find(s => s.change_type === 'create')?.total_count || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowUpDown className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">本月更新</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {stats.totalStats.find(s => s.change_type === 'update')?.total_count || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">本月删除</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {stats.totalStats.find(s => s.change_type === 'delete')?.total_count || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">活跃SPU</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {stats.activeSpu.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 搜索和筛选 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label htmlFor="spu" className="block text-sm font-medium text-slate-700 mb-2">
              SPU编号
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="spu"
                type="text"
                              value={filterInputs.spu}
              onChange={(e) => handleInputChange('spu', e.target.value)}
              onKeyPress={handleSearchKeyPress}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="输入SPU编号"
              />
            </div>
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
          
          <div>
            <label htmlFor="changeType" className="block text-sm font-medium text-slate-700 mb-2">
              变更类型
            </label>
            <select
              id="changeType"
                          value={filterInputs.change_type}
            onChange={(e) => handleInputChange('change_type', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">全部类型</option>
              <option value="create">创建</option>
              <option value="update">更新</option>
              <option value="delete">删除</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-2">
              开始日期
            </label>
            <input
              id="startDate"
              type="date"
                          value={filterInputs.start_date}
            onChange={(e) => handleInputChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-2">
              结束日期
            </label>
            <input
              id="endDate"
              type="date"
                          value={filterInputs.end_date}
            onChange={(e) => handleInputChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-600">
            共找到 {pagination.total} 条记录
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSearch}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Search className="h-4 w-4 mr-2" />
              搜索
            </button>
            <button
              onClick={handleResetSearch}
              className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              重置
            </button>
          </div>
        </div>
        
        {/* 当前搜索条件显示 */}
        {(filters.spu || filters.country_code || filters.quantity || filters.change_type || filters.start_date || filters.end_date) && (
          <div className="mt-4 flex items-center space-x-4 text-sm text-slate-600">
            <span>当前搜索条件：</span>
            {filters.spu && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 group">
                SPU: {filters.spu}
                <button
                  onClick={() => handleRemoveFilter('spu')}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300 hover:text-blue-800 transition-colors"
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
            {filters.change_type && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 group">
                类型: {getChangeTypeLabel(filters.change_type).label}
                <button
                  onClick={() => handleRemoveFilter('change_type')}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-200 text-green-600 hover:bg-green-300 hover:text-green-800 transition-colors"
                  title="移除类型筛选"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.start_date && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 group">
                开始: {filters.start_date}
                <button
                  onClick={() => handleRemoveFilter('start_date')}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-yellow-200 text-yellow-600 hover:bg-yellow-300 hover:text-yellow-800 transition-colors"
                  title="移除开始日期筛选"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.end_date && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-800 group">
                结束: {filters.end_date}
                <button
                  onClick={() => handleRemoveFilter('end_date')}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-200 text-red-600 hover:bg-red-300 hover:text-red-800 transition-colors"
                  title="移除结束日期筛选"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 历史记录列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  SPU信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  国家/数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  变更类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  价格变化
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作人员
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  变更时间
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {(history || []).map((record) => {
                const changeType = getChangeTypeLabel(record.change_type);
                const priceChange = getPriceChange(record.old_total_price, record.new_total_price);
                
                return (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-slate-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-slate-900">{record.spu}</div>
                          <div className="text-sm text-slate-500">{record.spu_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 text-slate-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {getCountryName(record.country_code)}
                          </div>
                          <div className="text-sm text-slate-500">数量: {record.quantity}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${changeType.color}`}>
                        {changeType.label}
                      </span>
                      {record.change_reason && (
                        <div className="text-xs text-slate-500 mt-1">{record.change_reason}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-500">{formatCurrency(record.old_total_price)}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-medium text-slate-900">{formatCurrency(record.new_total_price)}</span>
                        </div>
                        {record.change_type === 'update' && priceChange.amount > 0 && (
                          <div className={`flex items-center text-xs mt-1 ${priceChange.isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                            {priceChange.isIncrease ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {priceChange.isIncrease ? '+' : '-'}{formatCurrency(priceChange.amount)} ({priceChange.percent.toFixed(1)}%)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-slate-400 mr-2" />
                        <div className="text-sm text-slate-900">{record.admin_name || 'Unknown'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-500">
                        <Clock className="h-4 w-4 mr-2" />
                        {new Date(record.created_at).toLocaleString('zh-CN')}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
      {!loading && history.length === 0 && (
        <div className="text-center py-12">
          {/* 区分无数据和搜索无结果 */}
          {(filters.spu || filters.country_code || filters.quantity || filters.change_type || filters.start_date || filters.end_date) ? (
            // 搜索无结果
            <>
              <Search className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">搜索无结果</h3>
              <p className="mt-1 text-sm text-slate-500">没有找到符合条件的价格变更记录，请尝试其他搜索条件</p>
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
              <Clock className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">暂无变更记录</h3>
              <p className="mt-1 text-sm text-slate-500">还没有任何价格变更记录</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SPUPriceHistoryPage;
