import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import ProgressModal from '../components/ProgressModal';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    clientId: '',
    orderId: '',
    status: '',
    paymentTimeStart: '',
    paymentTimeEnd: '',
    settlementStatus: '',
    buyerName: '',
    page: 1,
    limit: 50
  });
  const [importResult, setImportResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [progressModal, setProgressModal] = useState({
    isOpen: false,
    title: '',
    progress: 0,
    currentStep: '',
    totalItems: 0,
    processedItems: 0
  });

  // 获取订单列表
  const fetchOrders = async () => {
    if (!filters.clientId) {
      alert('请输入客户ID');
      return;
    }
    
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        orderBy: 'created_at',
        orderDirection: 'DESC'
      };

      // 添加筛选条件
      if (filters.status) params.status = filters.status;
      if (filters.settlementStatus) params.settlementStatus = filters.settlementStatus;
      if (filters.buyerName) params.buyerName = filters.buyerName;
      if (filters.paymentTimeStart) params.paymentTimeStart = filters.paymentTimeStart;
      if (filters.paymentTimeEnd) params.paymentTimeEnd = filters.paymentTimeEnd;

      const response = await api.get(`/admin/orders/client/${filters.clientId}`, { params });

      if (response.success) {
        setOrders(response.data.orders);
        setStats(response.data.stats);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('获取订单失败:', error);
      alert('获取订单失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };



  // 处理文件验证和设置
  const processFile = (file) => {
    if (!file) return false;
    
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(file.type)) {
      alert('请选择Excel文件 (.xlsx 或 .xls)');
      return false;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      alert('文件大小不能超过50MB');
      return false;
    }
    
    setSelectedFile(file);
    return true;
  };

  // 处理拖放事件
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  // 处理文件选择
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    processFile(file);
  };

  // 测试解析Excel
  const testParseExcel = async () => {
    if (!selectedFile) {
      alert('请先选择文件');
      return;
    }

    // 清除之前的结果
    setImportResult(null);
    
    // 显示解析进度
    setProgressModal({
      isOpen: true,
      title: 'Excel解析测试中',
      progress: 0,
      currentStep: '开始解析文件...',
      totalItems: 0,
      processedItems: 0
    });

    setUploading(true);
    
    try {
      // 模拟解析进度
      const steps = [
        { progress: 20, step: '读取Excel文件...', delay: 300 },
        { progress: 50, step: '解析数据结构...', delay: 500 },
        { progress: 80, step: '验证数据格式...', delay: 700 },
        { progress: 100, step: '解析完成！', delay: 200 }
      ];

      // 开始进度模拟
      let currentIndex = 0;
      const updateProgress = () => {
        if (currentIndex < steps.length) {
          const step = steps[currentIndex];
          setProgressModal(prev => ({
            ...prev,
            progress: step.progress,
            currentStep: step.step
          }));
          currentIndex++;
          setTimeout(updateProgress, step.delay);
        }
      };
      updateProgress();

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await api.post('/admin/orders/test-parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.success) {
        setImportResult({
          type: 'test',
          ...response.data
        });
        
        // 延迟关闭进度条并显示成功消息
        setTimeout(() => {
          setProgressModal(prev => ({ ...prev, isOpen: false }));
          alert('Excel解析测试成功！请查看解析结果。');
        }, 1000);
      }
    } catch (error) {
      console.error('测试解析失败:', error);
      setProgressModal(prev => ({ ...prev, isOpen: false }));
      alert('测试解析失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  // 模拟进度更新（因为后端是同步处理，我们模拟进度）
  const simulateProgress = (totalItems) => {
    return new Promise((resolve) => {
      let progress = 0;
      const steps = [
        { progress: 10, step: '解析Excel文件...', delay: 500 },
        { progress: 20, step: '验证订单数据...', delay: 800 },
        { progress: 30, step: '准备数据分组...', delay: 300 },
        { progress: 50, step: '开始批量插入...', delay: 1000 },
        { progress: 70, step: '处理数据库操作...', delay: 1500 },
        { progress: 90, step: '完成数据插入...', delay: 800 },
        { progress: 100, step: '导入完成！', delay: 300 }
      ];

      let currentIndex = 0;
      
      const updateProgress = () => {
        if (currentIndex < steps.length) {
          const step = steps[currentIndex];
          setProgressModal(prev => ({
            ...prev,
            progress: step.progress,
            currentStep: step.step,
            processedItems: Math.floor((step.progress / 100) * totalItems)
          }));
          
          currentIndex++;
          setTimeout(updateProgress, step.delay);
        } else {
          resolve();
        }
      };
      
      updateProgress();
    });
  };

  // 导入Excel
  const importExcel = async () => {
    if (!selectedFile) {
      alert('请先选择文件');
      return;
    }

    if (!window.confirm('确定要导入这个Excel文件吗？这将向数据库添加订单数据。')) {
      return;
    }

    // 先获取解析结果来估算数据量
    let estimatedTotal = 1000; // 默认估算值
    if (importResult && importResult.parseResult) {
      estimatedTotal = importResult.parseResult.parsed || 1000;
    }

    // 清除之前的导入结果
    setImportResult(null);
    
    // 显示进度条
    setProgressModal({
      isOpen: true,
      title: 'Excel导入进行中',
      progress: 0,
      currentStep: '准备开始导入...',
      totalItems: estimatedTotal,
      processedItems: 0
    });

    setUploading(true);
    
    try {
      // 开始模拟进度
      const progressPromise = simulateProgress(estimatedTotal);
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      // 同时执行API调用和进度模拟
      const [response] = await Promise.all([
        api.post('/admin/orders/import', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 300000, // 5分钟超时
        }),
        progressPromise
      ]);

      if (response.success) {
        setImportResult({
          type: 'import',
          ...response.data
        });
        
        // 显示成功消息
        setTimeout(() => {
          setProgressModal(prev => ({ ...prev, isOpen: false }));
          
          const successMsg = `Excel导入成功！
正常订单: ${response.data.insertResult.success}条
异常订单: ${response.data.insertResult.abnormal || 0}条  
失败: ${response.data.insertResult.failed}条

详细统计:
- 解析成功: ${response.data.parseResult.parsed}条
- 验证通过: ${response.data.validationResult.validCount}条
- 验证失败: ${response.data.validationResult.invalidCount}条`;

          alert(successMsg);
          
          // 如果有客户ID筛选，重新获取订单列表
          if (filters.clientId) {
            fetchOrders();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('导入失败:', error);
      setProgressModal(prev => ({ ...prev, isOpen: false }));
      alert('导入失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  // 查询特定订单号
  const searchOrderById = async (orderId) => {
    if (!orderId || !orderId.includes('-')) {
      alert('请输入正确的订单号格式，如：7268217-3290');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/admin/orders/order/${orderId}`);
      
      if (response.success) {
        setOrders(response.data.orders);
        setStats({});
      }
    } catch (error) {
      console.error('查询订单失败:', error);
      alert('查询订单失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 查询异常订单
  const fetchAbnormalOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/orders/abnormal', {
        params: {
          page: 1,
          limit: 100 // 显示更多异常订单
        }
      });

      if (response.success) {
        setOrders(response.data.orders);
        setStats({}); // 清空统计信息
        alert(`查询到 ${response.data.orders.length} 条异常订单`);
      }
    } catch (error) {
      console.error('查询异常订单失败:', error);
      alert('查询异常订单失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 格式化金额
  const formatAmount = (amount) => {
    if (!amount) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // 监听筛选条件变化，自动重新查询
  useEffect(() => {
    if (filters.clientId && filters.page > 0) {
      fetchOrders();
    }
  }, [filters.page, filters.limit]); // 只监听分页变化，其他筛选需要手动点击查询

  // 渲染统计信息
  const renderStats = () => {
    if (!stats || !Array.isArray(stats) || stats.length === 0) return null;

    const totalOrders = stats.reduce((sum, stat) => sum + stat.status_count, 0);
    const totalProducts = stats.reduce((sum, stat) => sum + parseInt(stat.total_products || 0), 0);
    const totalSettlement = stats.reduce((sum, stat) => sum + parseFloat(stat.total_settlement || 0), 0);

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h3 className="text-lg font-semibold mb-4">订单统计</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalOrders}</div>
            <div className="text-sm text-gray-500">总订单数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalProducts}</div>
            <div className="text-sm text-gray-500">总商品数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{formatAmount(totalSettlement)}</div>
            <div className="text-sm text-gray-500">总结算金额</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {stats.filter(s => s.order_status === '待打单（缺货）').reduce((sum, s) => sum + s.status_count, 0)}
            </div>
            <div className="text-sm text-gray-500">待处理订单</div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染导入结果
  const renderImportResult = () => {
    if (!importResult) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h3 className="text-lg font-semibold mb-6">
          {importResult.type === 'test' ? '解析测试结果' : '导入结果'}
        </h3>
        
        {/* 解析统计 */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-700 mb-3">📊 解析统计</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {importResult.parseResult?.total || 0}
              </div>
              <div className="text-sm text-gray-600">总行数</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {importResult.parseResult?.parsed || 0}
              </div>
              <div className="text-sm text-gray-600">解析成功</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {importResult.parseResult?.failed || 0}
              </div>
              <div className="text-sm text-gray-600">解析失败</div>
            </div>
          </div>
        </div>

        {/* 验证统计 */}
        {importResult.validationResult && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">✅ 数据验证</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.validationResult.validCount}
                </div>
                <div className="text-sm text-gray-600">验证通过</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.validationResult.invalidCount}
                </div>
                <div className="text-sm text-gray-600">验证失败</div>
              </div>
            </div>
          </div>
        )}

        {/* 数据库插入统计 */}
        {importResult.insertResult && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">💾 数据库操作</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.insertResult.success}
                </div>
                <div className="text-sm text-gray-600">正常订单</div>
                <div className="text-xs text-gray-500">插入/更新成功</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {importResult.insertResult.abnormal || 0}
                </div>
                <div className="text-sm text-gray-600">异常订单</div>
                <div className="text-xs text-gray-500">存储到异常表</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.insertResult.failed}
                </div>
                <div className="text-sm text-gray-600">处理失败</div>
                <div className="text-xs text-gray-500">未能存储</div>
              </div>
            </div>
          </div>
        )}

        {/* 数据样例 */}
        {importResult.sampleOrders && importResult.sampleOrders.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">📋 数据样例</h4>
            <div className="bg-gray-50 border rounded-lg">
              {importResult.sampleOrders.slice(0, 5).map((order, index) => (
                <div key={index} className={`p-3 ${index > 0 ? 'border-t border-gray-200' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        订单{index + 1}: #{(() => {
                          try {
                            if (order.dxm_order_id && order.dxm_order_id.includes('-')) {
                              return order.dxm_order_id.split('-')[1];
                            }
                            return '解析失败';
                          } catch (e) {
                            return '解析失败';
                          }
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">
                        完整订单号: {order.dxm_order_id}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        买家: {order.buyer_name} ({order.country_code})
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        产品: {order.product_name?.substring(0, 60)}
                        {order.product_name?.length > 60 && '...'}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>状态: {order.order_status}</div>
                      <div>SKU: {order.product_sku || '-'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 验证错误详情 */}
        {importResult.validationResult && importResult.validationResult.invalid && importResult.validationResult.invalid.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-red-700 mb-3">❌ 验证失败详情 (前10条)</h4>
            <div className="bg-red-50 border border-red-200 rounded-lg max-h-60 overflow-y-auto">
              {importResult.validationResult.invalid.slice(0, 10).map((invalid, index) => (
                <div key={index} className={`p-3 ${index > 0 ? 'border-t border-red-200' : ''}`}>
                  <div className="font-medium text-red-800">
                    第{invalid.index + 1}行订单验证失败
                  </div>
                  <div className="text-sm text-red-600 mt-1">
                    错误: {invalid.errors.join(', ')}
                  </div>
                  <div className="text-xs text-red-500 mt-1">
                    订单号: {invalid.order?.dxm_order_id || '无'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">订单管理</h1>
        <p className="text-gray-600">管理和导入订单数据</p>
      </div>

      {/* Excel导入区域 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="text-lg font-semibold mb-4">Excel导入</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择Excel文件
            </label>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-file-input"
              />
              
              <div className="flex flex-col items-center space-y-4">
                <div className="text-gray-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                
                <div>
                  <label
                    htmlFor="excel-file-input"
                    className="cursor-pointer px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-block"
                  >
                    选择Excel文件
                  </label>
                  <p className="text-sm text-gray-500 mt-3">
                    或将文件拖拽到此区域
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    支持 .xlsx 和 .xls 格式，最大50MB
                  </p>
                </div>
              </div>
            </div>

            {/* 文件选择状态显示 */}
            {selectedFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-800 font-medium">{selectedFile.name}</span>
                    <span className="text-green-600 text-sm">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setImportResult(null);
                      // 清空文件输入框
                      const fileInput = document.getElementById('excel-file-input');
                      if (fileInput) {
                        fileInput.value = '';
                      }
                    }}
                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100 transition-colors duration-200"
                    title="删除文件"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={testParseExcel}
              disabled={!selectedFile || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? '解析中...' : '测试解析'}
            </button>
            
            <button
              onClick={importExcel}
              disabled={!selectedFile || uploading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? '导入中...' : '导入数据'}
            </button>
          </div>

          {/* 验证规则说明 */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-3">📋 数据验证规则说明</h4>
            
            <div className="space-y-3 text-sm text-blue-700">
              <div>
                <h5 className="font-medium text-blue-800">🔴 必需字段验证（普通订单）</h5>
                <p className="text-blue-600 ml-4">
                  以下字段不能为空：订单号、国家代码、产品数量、买家姓名、付款时间、订单状态
                </p>
              </div>
              
              <div>
                <h5 className="font-medium text-blue-800">🟡 已退款订单特殊规则</h5>
                <p className="text-blue-600 ml-4">
                  订单状态包含"退款"的订单只需验证：订单号、订单状态
                </p>
              </div>
              
              <div>
                <h5 className="font-medium text-blue-800">📏 格式验证规则</h5>
                <ul className="text-blue-600 ml-4 space-y-1">
                  <li>• 订单号：必须是"数字-数字"格式（如：7268217-3290）</li>
                  <li>• 付款时间：必须是有效的日期格式</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 导入结果 */}
      {renderImportResult()}

      {/* 订单查询区域 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h2 className="text-lg font-semibold mb-4">订单查询</h2>
        
        {/* 第一行：基础筛选 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              客户ID <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={filters.clientId}
              onChange={(e) => setFilters(prev => ({ ...prev, clientId: e.target.value, page: 1 }))}
              placeholder="如：7268217"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              订单号
            </label>
            <input
              type="text"
              value={filters.orderId}
              onChange={(e) => setFilters(prev => ({ ...prev, orderId: e.target.value, page: 1 }))}
              placeholder="如：3290"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              买家姓名
            </label>
            <input
              type="text"
              value={filters.buyerName}
              onChange={(e) => setFilters(prev => ({ ...prev, buyerName: e.target.value, page: 1 }))}
              placeholder="如：张三"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 第二行：状态和时间筛选 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              订单状态
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option value="未付款">未付款</option>
              <option value="风控中">风控中</option>
              <option value="待审核">待审核</option>
              <option value="待处理">待处理</option>
              <option value="待打单（有货）">待打单（有货）</option>
              <option value="待打单（缺货）">待打单（缺货）</option>
              <option value="待打单（异常）">待打单（异常）</option>
              <option value="已发货">已发货</option>
              <option value="已退款">已退款</option>
              <option value="已忽略">已忽略</option>
              <option value="已处理">已处理</option>
              <option value="已审核">已审核</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              结算状态
            </label>
            <select
              value={filters.settlementStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, settlementStatus: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部结算状态</option>
              <option value="waiting">待结算</option>
              <option value="settled">已结算</option>
              <option value="cancel">已取消</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              付款开始时间
            </label>
            <input
              type="datetime-local"
              value={filters.paymentTimeStart}
              onChange={(e) => setFilters(prev => ({ ...prev, paymentTimeStart: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              付款结束时间
            </label>
            <input
              type="datetime-local"
              value={filters.paymentTimeEnd}
              onChange={(e) => setFilters(prev => ({ ...prev, paymentTimeEnd: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 查询按钮和快捷操作 */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchOrders}
            disabled={loading || !filters.clientId}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '查询中...' : '查询订单'}
          </button>

          <button
            onClick={() => {
              if (filters.orderId && filters.clientId) {
                searchOrderById(`${filters.clientId}-${filters.orderId}`);
              } else {
                alert('请输入客户ID和订单号');
              }
            }}
            disabled={loading || !filters.clientId || !filters.orderId}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            精确查询
          </button>

          <button
            onClick={fetchAbnormalOrders}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            查看异常订单
          </button>

          <button
            onClick={() => {
              setFilters(prev => ({
                ...prev,
                orderId: '',
                status: '',
                paymentTimeStart: '',
                paymentTimeEnd: '',
                settlementStatus: '',
                buyerName: '',
                page: 1
              }));
              setOrders([]);
              setStats({});
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            清空筛选
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      {renderStats()}

      {/* 订单列表 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">订单列表</h2>
            {orders.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                显示第 {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 条，共 {pagination.total} 条订单，{pagination.pages} 页
              </p>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">加载中...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            暂无订单数据
          </div>
        ) : (
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
                    物流信息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    备注信息
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    {/* 订单信息 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_id ? `#${order.order_id}` : '异常订单'}
                      </div>
                      <div className="text-sm text-gray-500">
                        客户ID: {order.dxm_client_id || '无法解析'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {order.dxm_order_id}
                      </div>
                      {order.parse_error && (
                        <div className="text-xs text-red-500 mt-1">
                          错误: {order.parse_error}
                        </div>
                      )}
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
                        {formatDate(order.payment_time)}
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
                      <div className="text-xs text-gray-500">
                        父SPU: {order.product_parent_spu || '-'}
                      </div>
                      <div className="text-xs text-blue-600">
                        数量: {order.product_count}
                      </div>
                    </td>

                    {/* 价格信息 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        单件价: {formatAmount(order.unit_price)}
                      </div>
                      <div className="text-sm text-gray-600">
                        多件总价: {formatAmount(order.multi_total_price)}
                      </div>
                      <div className="text-sm text-orange-600">
                        折扣率: {parseFloat(order.discount || 0).toFixed(2)}%
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        应收结算: {formatAmount(order.settlement_amount)}
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
                          order.settlement_status === 'settled' ? 'bg-green-100 text-green-700' :
                          order.settlement_status === 'cancel' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.settlement_status === 'waiting' ? '待结算' : 
                           order.settlement_status === 'settled' ? '已结算' : '已取消'}
                        </span>
                      </div>
                    </td>

                    {/* 物流信息 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.waybill_number || '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        运单号
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
                              return <div className="text-gray-500">备注解析失败</div>;
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
        )}

        {/* 分页控件 */}
        {orders.length > 0 && (
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">每页显示</span>
              <select
                value={filters.limit}
                onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
              <span className="text-sm text-gray-700">条</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              
              <span className="text-sm text-gray-700">
                第 {pagination.page} / {pagination.pages} 页
              </span>
              
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasNext}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 进度条模态框 */}
      <ProgressModal
        isOpen={progressModal.isOpen}
        title={progressModal.title}
        progress={progressModal.progress}
        currentStep={progressModal.currentStep}
        totalItems={progressModal.totalItems}
        processedItems={progressModal.processedItems}
        onCancel={() => {
          setProgressModal(prev => ({ ...prev, isOpen: false }));
          setUploading(false);
        }}
      />
    </div>
  );
};

export default OrdersPage;


