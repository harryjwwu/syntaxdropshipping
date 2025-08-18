import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Package, Tag, Eye, Image, Upload, Download } from 'lucide-react';
import { adminAPI } from '../utils/api';
import { generateListThumbnailURL } from '../services/cosService';
import toast from 'react-hot-toast';

const SPUPage = () => {
  const [spus, setSpus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState(''); // 搜索输入框的值
  const [parentSpuFilter, setParentSpuFilter] = useState('');
  const [parentSpuFilterInput, setParentSpuFilterInput] = useState(''); // 父SPU筛选输入框的值
  const [importing, setImporting] = useState(false); // 批量导入状态
  const [previewImage, setPreviewImage] = useState(null); // 图片预览状态
  const [importResult, setImportResult] = useState(null); // 导入结果状态
  
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // 获取SPU列表
  const fetchSpus = async () => {
    try {
      console.log('🔍 SPU页面 - 开始获取SPU列表...');
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        parent_spu: parentSpuFilter
      };
      
      console.log('📋 SPU页面 - 请求参数:', params);
      const response = await adminAPI.getSpus(params);
      console.log('✅ SPU页面 - 获取成功:', response);
      console.log('📊 SPU页面 - 响应数据结构:', {
        success: response.success,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'null',
        dataArray: response.data?.data,
        dataArrayLength: response.data?.data?.length,
        pagination: response.data?.pagination
      });
      
      // 后端直接返回data数组，不是data.data
      const spuData = response.data || [];
      console.log('📋 SPU页面 - 设置SPU数据:', spuData);
      setSpus(spuData);
      
      const paginationData = response.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      };
      console.log('📋 SPU页面 - 设置分页数据:', paginationData);
      setPagination(paginationData);
    } catch (error) {
      console.error('❌ SPU页面 - 获取SPU列表失败:', error);
      console.error('错误详情:', error.response || error.message);
      toast.error('获取SPU列表失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载和搜索条件变化时获取数据
  useEffect(() => {
    console.log('🔄 SPU页面 - 搜索/分页条件改变，重新获取数据...');
    console.log('📋 当前搜索条件:', { search, parentSpuFilter, page: pagination.page });
    fetchSpus();
  }, [search, parentSpuFilter, pagination.page]);

  // 键盘事件处理（ESC键关闭图片预览）
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && previewImage) {
        setPreviewImage(null);
      }
    };

    if (previewImage) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // 防止背景滚动
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [previewImage]);

  // 执行搜索
  const handleSearch = () => {
    console.log('🔍 执行搜索:', { searchInput, parentSpuFilterInput });
    setSearch(searchInput);
    setParentSpuFilter(parentSpuFilterInput);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 重置搜索
  const handleResetSearch = () => {
    console.log('🔄 重置搜索开始');
    console.log('📋 重置前状态:', { search, parentSpuFilter, searchInput, parentSpuFilterInput });
    
    setSearchInput('');
    setParentSpuFilterInput('');
    setSearch('');
    setParentSpuFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
    
    console.log('✅ 重置搜索完成，即将触发useEffect重新获取数据');
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

  // 删除SPU
  const handleDeleteSpu = async (spu) => {
    if (!window.confirm(`确定要删除SPU "${spu}" 吗？此操作不可撤销。`)) {
      return;
    }

    try {
      await adminAPI.deleteSpu(spu);
      toast.success('SPU删除成功');
      fetchSpus();
    } catch (error) {
      console.error('删除SPU失败:', error);
      toast.error(error.response?.data?.message || '删除SPU失败');
    }
  };

  // 查看SPU详情
  const handleViewSpu = (spu) => {
    navigate(`/spus/${spu}`);
  };

  // 编辑SPU
  const handleEditSpu = (spu) => {
    navigate(`/spus/${spu}/edit`);
  };

  // 新增SPU
  const handleCreateSpu = () => {
    navigate('/spus/new');
  };

  // 下载模板
  const handleDownloadTemplate = async () => {
    try {
      console.log('📥 开始下载SPU导入模板...');
      const response = await adminAPI.downloadSpuTemplate();
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', '批量导入SPU模板.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('模板下载成功');
    } catch (error) {
      console.error('❌ 下载模板失败:', error);
      toast.error('下载模板失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 批量导入
  const handleBatchImport = () => {
    fileInputRef.current?.click();
  };

  // 文件选择处理
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('请选择Excel文件(.xlsx 或 .xls)');
      return;
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过10MB');
      return;
    }

    try {
      setImporting(true);
      console.log('📤 开始上传Excel文件:', file.name);
      
      // 显示开始导入的提示
      toast.loading('正在解析Excel文件并导入数据...', {
        id: 'importing',
        duration: Infinity
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await adminAPI.importSpus(formData);
      console.log('✅ 批量导入响应:', response);
      
      if (response.success) {
        const { data } = response;
        
        // 分类错误信息
        const duplicateErrors = data.errors?.filter(err => err.includes('已存在')) || [];
        const otherErrors = data.errors?.filter(err => !err.includes('已存在')) || [];
        
        // 设置导入结果数据，用于显示专业弹窗
        setImportResult({
          ...data,
          duplicateErrors,
          otherErrors,
          fileName: fileInputRef.current?.files[0]?.name || 'Excel文件'
        });
        
        // 简单的成功提示
        if (data.failedSpu === 0 && data.failedSku === 0) {
          toast.success(`导入成功！SPU: ${data.successSpu} 个，SKU: ${data.successSku} 个`);
        }
        
        // 刷新列表
        fetchSpus();
      } else {
        toast.error('导入失败: ' + response.message);
      }
      
    } catch (error) {
      console.error('❌ 批量导入失败:', error);
      toast.error('批量导入失败: ' + (error.response?.data?.message || error.message));
    } finally {
      // 关闭loading提示
      toast.dismiss('importing');
      setImporting(false);
      // 清空文件输入框
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
          <h1 className="text-2xl font-bold text-slate-900">SPU管理</h1>
          <p className="text-slate-600">管理商品SPU和关联的SKU</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Download className="h-4 w-4 mr-2" />
            下载模板
          </button>
          <button
            onClick={handleBatchImport}
            disabled={importing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {importing ? '正在导入...' : '批量导入'}
          </button>
          <button
            onClick={handleCreateSpu}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            新增SPU
          </button>
        </div>
      </div>

      {/* 隐藏的文件输入框 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* 搜索和筛选 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-2">
              搜索SPU
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="search"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="输入SPU编号或名称"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="parentSpu" className="block text-sm font-medium text-slate-700 mb-2">
              父SPU筛选
            </label>
            <input
              id="parentSpu"
              type="text"
              value={parentSpuFilterInput}
              onChange={(e) => setParentSpuFilterInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="输入父SPU编号"
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
              共找到 {pagination.total} 个SPU
            </div>
          </div>
        </div>
        
        {/* 当前搜索条件显示 */}
        {(search || parentSpuFilter) && (
          <div className="mt-4 flex items-center space-x-4 text-sm text-slate-600">
            <span>当前搜索条件：</span>
            {search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                关键词: {search}
              </span>
            )}
            {parentSpuFilter && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                父SPU: {parentSpuFilter}
              </span>
            )}
          </div>
        )}
      </div>

      {/* SPU列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  SPU信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  商品图片
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  基本信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  关联SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  父SPU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {(spus || []).map((spu) => (
                <tr key={spu.spu} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-slate-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{spu.spu}</div>
                        <div className="text-sm text-slate-500">{spu.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {spu.photo ? (
                      <div className="relative">
                        <img
                          src={generateListThumbnailURL(spu.photo, 48, 75)}
                          alt={spu.name}
                          className="h-12 w-12 rounded-lg object-cover border border-slate-200 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            setPreviewImage({
                              url: spu.photo,
                              alt: spu.name
                            });
                          }}
                          onError={(e) => {
                            console.log('⚠️ 缩略图加载失败，使用原图:', spu.photo);
                            e.target.src = spu.photo;
                          }}
                        />
                        {/* 点击提示 */}
                        <div className="absolute inset-0 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 hover:bg-black hover:bg-opacity-20 transition-all duration-200 pointer-events-none">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                        <Image className="h-6 w-6 text-slate-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {spu.weight && <div>重量: {parseFloat(spu.weight).toFixed(2)}kg</div>}
                      {spu.logistics_methods && <div>物流: {spu.logistics_methods}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {spu.skus && spu.skus.length > 0 ? (
                        spu.skus.map((sku, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {sku}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">无关联SKU</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {spu.parent_spu && spu.parent_spu !== spu.spu ? (
                        <div>
                          <div className="font-medium">{spu.parent_spu}</div>
                          {spu.parent_spu_name && (
                            <div className="text-slate-500">{spu.parent_spu_name}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">根SPU</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(spu.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewSpu(spu.spu)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200"
                        title="查看详情"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        查看
                      </button>
                      <button
                        onClick={() => handleEditSpu(spu.spu)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                        title="编辑SPU"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteSpu(spu.spu)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                        title="删除SPU"
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

      {/* 调试信息 */}
      {console.log('🖼️ SPU页面渲染 - spus:', spus, 'length:', spus?.length, 'loading:', loading)}
      
      {/* 空状态 */}
      {!loading && spus.length === 0 && (
        <div className="text-center py-12">
          {/* 区分无数据和搜索无结果 */}
          {search || parentSpuFilter ? (
            // 搜索无结果
            <>
              <Search className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">搜索无结果</h3>
              <p className="mt-1 text-sm text-slate-500">没有找到符合条件的SPU，请尝试其他搜索条件</p>
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
              <Package className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">暂无SPU</h3>
              <p className="mt-1 text-sm text-slate-500">开始创建您的第一个SPU吧</p>
              <div className="mt-6">
                <button
                  onClick={handleCreateSpu}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新增SPU
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 图片预览模态框 */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => {
            setPreviewImage(null);
          }}
          style={{ zIndex: 9999 }} // 确保在最顶层
        >
          <div className="relative max-w-4xl max-h-4xl p-4">            
            <img 
              src={previewImage.url} 
              alt={previewImage.alt} 
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
              }}
              onError={(e) => {
                // 如果图片加载失败，尝试直接使用原始URL（去掉可能的URL编码问题）
                const originalUrl = previewImage.url.replace(/%20/g, ' ');
                if (e.target.src !== originalUrl) {
                  e.target.src = originalUrl;
                }
              }}
              style={{ 
                maxWidth: '90vw', 
                maxHeight: '90vh',
                backgroundColor: 'white' // 添加白色背景防止透明图片看不清
              }}
            />
            <button 
              className="absolute top-2 right-2 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setPreviewImage(null);
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

          </div>
        </div>
      )}

      {/* 导入结果弹窗 */}
      {importResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-hidden">
            {/* 弹窗标题 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  批量导入结果报告
                </h3>
                <button
                  onClick={() => setImportResult(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">文件：{importResult.fileName}</p>
            </div>

            {/* 导入统计 */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">SPU导入统计</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">总数：</span>
                      <span className="text-sm font-medium">{importResult.totalSpu} 个</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-600">成功：</span>
                      <span className="text-sm font-medium text-green-600">{importResult.successSpu} 个</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-red-600">失败：</span>
                      <span className="text-sm font-medium text-red-600">{importResult.failedSpu} 个</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">SKU导入统计</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">总数：</span>
                      <span className="text-sm font-medium">{importResult.totalSku} 个</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-600">成功：</span>
                      <span className="text-sm font-medium text-green-600">{importResult.successSku} 个</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-red-600">失败：</span>
                      <span className="text-sm font-medium text-red-600">{importResult.failedSku} 个</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 错误详情 */}
            {(importResult.duplicateErrors.length > 0 || importResult.otherErrors.length > 0) && (
              <div className="px-6 py-4 max-h-96 overflow-y-auto">
                {/* 重复SPU错误 */}
                {importResult.duplicateErrors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-red-600 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      重复SPU ({importResult.duplicateErrors.length} 个)
                    </h4>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="space-y-2">
                        {importResult.duplicateErrors.map((error, index) => {
                          // 解析错误信息，提取SPU编号和行号
                          const match = error.match(/第(\d+)行.*SPU\s+(\w+)\s+已存在/);
                          if (match) {
                            const [, rowNum, spuCode] = match;
                            return (
                              <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded border-l-4 border-red-400">
                                <div className="flex items-center">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-3">
                                    第{rowNum}行
                                  </span>
                                  <span className="text-sm text-gray-900">SPU <strong>{spuCode}</strong> 已存在于系统中</span>
                                </div>
                                <span className="text-xs text-red-600">已跳过</span>
                              </div>
                            );
                          }
                          return (
                            <div key={index} className="text-sm text-red-600 py-1">• {error}</div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 其他错误 */}
                {importResult.otherErrors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      其他错误 ({importResult.otherErrors.length} 个)
                    </h4>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="space-y-2">
                        {importResult.otherErrors.map((error, index) => (
                          <div key={index} className="text-sm text-red-600 py-1 px-3 bg-white rounded border-l-4 border-red-400">
                            • {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {importResult.failedSpu === 0 && importResult.failedSku === 0 ? (
                  <span className="text-green-600 font-medium">✅ 导入完全成功</span>
                ) : (
                  <span>
                    💡 建议：检查重复的SPU，修改Excel文件后重新导入
                  </span>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    // 导出错误详情到剪贴板
                    const errorText = [
                      `导入结果报告 - ${importResult.fileName}`,
                      `SPU: ${importResult.successSpu}/${importResult.totalSpu} 成功`,
                      `SKU: ${importResult.successSku}/${importResult.totalSku} 成功`,
                      '',
                      '错误详情:',
                      ...importResult.duplicateErrors,
                      ...importResult.otherErrors
                    ].join('\n');
                    
                    navigator.clipboard.writeText(errorText);
                    toast.success('错误详情已复制到剪贴板');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  复制详情
                </button>
                <button
                  onClick={() => setImportResult(null)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SPUPage;
