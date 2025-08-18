import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, Package, Tag, Image as ImageIcon, Scale, Truck, CheckCircle, XCircle, Loader } from 'lucide-react';
import { adminAPI } from '../utils/api';
import COSUpload from '../components/COSUpload';
import toast from 'react-hot-toast';

const SPUFormPage = () => {
  const navigate = useNavigate();
  const { spu: spuParam } = useParams();
  const isEdit = !!spuParam;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [spuList, setSpuList] = useState([]); // 用于父SPU选择
  const [logisticsMethods, setLogisticsMethods] = useState([]); // 物流方式枚举值
  
  const [formData, setFormData] = useState({
    spu: '',
    name: '',
    photo: '',
    logistics_methods: '',
    weight: '',
    parent_spu: '',
    skus: []
  });
  
  const [newSku, setNewSku] = useState('');
  
  // 父SPU验证状态
  const [parentSpuValidation, setParentSpuValidation] = useState({
    isValidating: false,
    isValid: null, // null: 未验证, true: 有效, false: 无效
    error: ''
  });

  // 获取SPU列表（用于父SPU选择）
  const fetchSpuList = async () => {
    try {
      console.log('🔍 开始获取SPU列表...');
      const response = await adminAPI.getSpus({ limit: 1000 });
      console.log('✅ SPU列表响应:', response);
      setSpuList(response.data.data || []);
    } catch (error) {
      console.error('❌ 获取SPU列表失败:', error);
      console.error('错误详情:', error.response || error.message);
      toast.error('获取SPU列表失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 获取物流方式枚举值
  const fetchLogisticsMethods = async () => {
    try {
      const response = await adminAPI.getEnumSetting('logistics_methods');
      setLogisticsMethods(response.data || []);
    } catch (error) {
      console.error('获取物流方式失败:', error);
      // 如果获取失败，使用默认值
      setLogisticsMethods(['海运', '空运', '快递', '陆运']);
    }
  };

  // 获取SPU详情（编辑模式）
  const fetchSpuDetail = async () => {
    if (!spuParam) return;
    
    try {
      setLoading(true);
      const response = await adminAPI.getSpu(spuParam);
      const spuData = response.data;
      
      setFormData({
        spu: spuData.spu,
        name: spuData.name || '',
        photo: spuData.photo || '',
        logistics_methods: spuData.logistics_methods || '',
        weight: spuData.weight || '',
        parent_spu: spuData.parent_spu || '',
        skus: spuData.skus || []
      });
    } catch (error) {
      console.error('获取SPU详情失败:', error);
      toast.error('获取SPU详情失败');
      navigate('/spus');
    } finally {
      setLoading(false);
    }
  };

  // 初始化
  useEffect(() => {
    fetchSpuList();
    fetchLogisticsMethods();
    if (isEdit) {
      fetchSpuDetail();
    }
  }, [isEdit, spuParam]);

  // 处理表单字段变化
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 验证SKU格式
  const validateSkuFormat = (sku) => {
    if (!sku || !sku.trim()) {
      return { isValid: false, error: 'SKU不能为空' };
    }

    const trimmedSku = sku.trim();
    const currentSpu = formData.spu.trim();

    if (!currentSpu) {
      return { isValid: false, error: '请先输入SPU编号' };
    }

    // 检查是否以SPU为前缀，用短横线分隔
    if (!trimmedSku.startsWith(currentSpu + '-')) {
      return { 
        isValid: false, 
        error: `SKU必须以"${currentSpu}-"为前缀` 
      };
    }

    // 检查短横线后是否有内容
    const suffix = trimmedSku.substring(currentSpu.length + 1);
    if (!suffix) {
      return { 
        isValid: false, 
        error: `SKU格式应为"${currentSpu}-xxx"` 
      };
    }

    // 检查是否已存在
    if (formData.skus.includes(trimmedSku)) {
      return { 
        isValid: false, 
        error: 'SKU已存在' 
      };
    }

    return { isValid: true, error: '' };
  };

  // 添加SKU
  const handleAddSku = () => {
    const validation = validateSkuFormat(newSku);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setFormData(prev => ({
      ...prev,
      skus: [...prev.skus, newSku.trim()]
    }));
    setNewSku('');
    toast.success('SKU添加成功');
  };

  // 删除SKU
  const handleRemoveSku = (index) => {
    setFormData(prev => ({
      ...prev,
      skus: prev.skus.filter((_, i) => i !== index)
    }));
  };

  // 处理图片上传成功 - 基于haishang_erp实现
  const handleImageUpload = (uploadResults) => {
    console.log('🖼️ SPUFormPage - 图片上传成功回调:', uploadResults);
    
    // uploadResults可能是单个结果或数组
    const result = Array.isArray(uploadResults) ? uploadResults[0] : uploadResults;
    
    console.log('🖼️ SPUFormPage - 处理的结果:', result);
    console.log('🖼️ SPUFormPage - 结果类型:', typeof result);
    console.log('🖼️ SPUFormPage - 结果的URL:', result?.url);
    
    if (result && result.url) {
      console.log('✅ SPUFormPage - 设置图片URL:', result.url);
      handleFieldChange('photo', result.url);
      toast.success('图片上传成功');
    } else {
      console.error('❌ SPUFormPage - 上传结果中没有URL:', result);
      console.error('❌ SPUFormPage - 完整结果对象:', JSON.stringify(result, null, 2));
      toast.error('图片上传成功但获取URL失败');
    }
  };

  // 处理图片上传失败
  const handleImageUploadError = (error) => {
    console.error('图片上传失败:', error);
    toast.error('图片上传失败: ' + error.message);
  };

  // 验证父SPU是否存在
  const validateParentSpu = async (parentSpuValue) => {
    // 如果为空，则视为根SPU，有效
    if (!parentSpuValue || !parentSpuValue.trim()) {
      setParentSpuValidation({
        isValidating: false,
        isValid: true,
        error: ''
      });
      return true;
    }

    // 如果是自己，也是有效的（表示根SPU）
    if (parentSpuValue.trim() === formData.spu.trim()) {
      setParentSpuValidation({
        isValidating: false,
        isValid: true,
        error: ''
      });
      return true;
    }

    setParentSpuValidation({
      isValidating: true,
      isValid: null,
      error: ''
    });

    try {
      // 检查父SPU是否存在
      const response = await adminAPI.getSpu(parentSpuValue.trim());
      if (response.success) {
        setParentSpuValidation({
          isValidating: false,
          isValid: true,
          error: ''
        });
        return true;
      } else {
        setParentSpuValidation({
          isValidating: false,
          isValid: false,
          error: 'SPU不存在'
        });
        return false;
      }
    } catch (error) {
      setParentSpuValidation({
        isValidating: false,
        isValid: false,
        error: 'SPU不存在'
      });
      return false;
    }
  };

  // 父SPU输入变化处理（带防抖）
  const handleParentSpuChange = (value) => {
    setFormData(prev => ({ ...prev, parent_spu: value }));
    
    // 清除之前的定时器
    if (window.parentSpuValidationTimer) {
      clearTimeout(window.parentSpuValidationTimer);
    }
    
    // 设置新的定时器，500ms后验证
    window.parentSpuValidationTimer = setTimeout(() => {
      validateParentSpu(value);
    }, 500);
  };

  // 验证表单
  const validateForm = () => {
    if (!formData.spu.trim()) {
      toast.error('请输入SPU编号');
      return false;
    }
    
    if (!formData.name.trim()) {
      toast.error('请输入商品名称');
      return false;
    }
    
    if (formData.weight && (isNaN(formData.weight) || formData.weight < 0)) {
      toast.error('重量必须为非负数');
      return false;
    }
    
    // 检查父SPU验证状态
    if (formData.parent_spu && formData.parent_spu.trim()) {
      if (parentSpuValidation.isValidating) {
        toast.error('正在验证父SPU，请稍候...');
        return false;
      }
      
      if (parentSpuValidation.isValid === false) {
        toast.error(`父SPU验证失败: ${parentSpuValidation.error}`);
        return false;
      }
    }
    
    return true;
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      const submitData = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        parent_spu: formData.parent_spu && formData.parent_spu.trim() ? formData.parent_spu.trim() : formData.spu // 如果没有输入父SPU，默认为自己
      };
      
      console.log('🚀 提交SPU数据:', submitData);
      
      if (isEdit) {
        await adminAPI.updateSpu(spuParam, submitData);
        toast.success('SPU更新成功');
      } else {
        await adminAPI.createSpu(submitData);
        toast.success('SPU创建成功');
      }
      
      navigate('/spus');
    } catch (error) {
      console.error('保存SPU失败:', error);
      toast.error(error.response?.data?.message || '保存SPU失败');
    } finally {
      setSaving(false);
    }
  };

  // 返回列表
  const handleBack = () => {
    navigate('/spus');
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
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEdit ? '编辑SPU' : '新增SPU'}
            </h1>
            <p className="text-slate-600">
              {isEdit ? '修改SPU信息和关联的SKU' : '创建新的SPU并添加关联的SKU'}
            </p>
          </div>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">基本信息</h3>
          </div>
          
          <div className="p-6 space-y-6">
            {/* SPU编号和名称 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="spu" className="block text-sm font-medium text-slate-700 mb-2">
                  <Package className="inline h-4 w-4 mr-1" />
                  SPU编号 *
                </label>
                <input
                  id="spu"
                  type="text"
                  value={formData.spu}
                  onChange={(e) => handleFieldChange('spu', e.target.value)}
                  disabled={isEdit} // 编辑时不允许修改SPU编号
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="输入SPU编号"
                  required
                />
                {isEdit && (
                  <p className="mt-1 text-xs text-slate-500">编辑时不能修改SPU编号</p>
                )}
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  商品名称 *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="输入商品名称"
                  required
                />
              </div>
            </div>

            {/* 商品图片 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <ImageIcon className="inline h-4 w-4 mr-1" />
                商品图片
              </label>
              <COSUpload
                value={formData.photo}
                onChange={(url) => handleFieldChange('photo', url)}
                onSuccess={handleImageUpload}
                onError={handleImageUploadError}
                accept="image/*"
                maxSize={10}
                buttonText="上传商品图片"
                className="max-w-md"
                imageWidth={300}
                imageHeight={300}
                showPreview={true}
                previewStyle={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease-in-out'
                }}
              />
            </div>

            {/* 重量和物流方式 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-slate-700 mb-2">
                  <Scale className="inline h-4 w-4 mr-1" />
                  重量 (KG)
                </label>
                <input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => handleFieldChange('weight', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="输入商品重量 (如: 0.5)"
                  min="0"
                />
                <p className="mt-1 text-xs text-slate-500">
                  请输入有效值，两个最接近的有效值分别为0和1。
                </p>
              </div>
              
              <div>
                <label htmlFor="logistics_methods" className="block text-sm font-medium text-slate-700 mb-2">
                  <Truck className="inline h-4 w-4 mr-1" />
                  物流方式
                </label>
                <select
                  id="logistics_methods"
                  value={formData.logistics_methods}
                  onChange={(e) => handleFieldChange('logistics_methods', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">请选择物流方式</option>
                  {/* 如果当前值不在枚举列表中，显示为自定义选项 */}
                  {formData.logistics_methods && !logisticsMethods.includes(formData.logistics_methods) && (
                    <option value={formData.logistics_methods}>
                      {formData.logistics_methods} (自定义)
                    </option>
                  )}
                  {logisticsMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 父SPU */}
            <div>
              <label htmlFor="parent_spu" className="block text-sm font-medium text-slate-700 mb-2">
                <Package className="inline h-4 w-4 mr-1" />
                父SPU
              </label>
              <div className="relative">
                <input
                  id="parent_spu"
                  type="text"
                  value={formData.parent_spu}
                  onChange={(e) => handleParentSpuChange(e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    formData.parent_spu && formData.parent_spu.trim()
                      ? parentSpuValidation.isValid === true
                        ? 'border-green-300 bg-green-50'
                        : parentSpuValidation.isValid === false
                        ? 'border-red-300 bg-red-50'
                        : 'border-yellow-300 bg-yellow-50'
                      : 'border-slate-300'
                  }`}
                  placeholder="输入父SPU编号（可为空或输入自己编号，表示根SPU）"
                />
                {/* 验证状态图标 */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {formData.parent_spu && formData.parent_spu.trim() && (
                    <>
                      {parentSpuValidation.isValidating && (
                        <Loader className="h-4 w-4 text-yellow-500 animate-spin" />
                      )}
                      {!parentSpuValidation.isValidating && parentSpuValidation.isValid === true && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {!parentSpuValidation.isValidating && parentSpuValidation.isValid === false && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </>
                  )}
                </div>
              </div>
              {/* 提示信息 */}
              <div className="mt-1">
                {formData.parent_spu && formData.parent_spu.trim() && parentSpuValidation.error && (
                  <p className="text-xs text-red-600 flex items-center">
                    <XCircle className="h-3 w-3 mr-1" />
                    {parentSpuValidation.error}
                  </p>
                )}
                {(!formData.parent_spu || !formData.parent_spu.trim()) && (
                  <p className="text-xs text-slate-500">
                    可以为空，为空则该SPU为根SPU
                  </p>
                )}
                {formData.parent_spu && formData.parent_spu.trim() && parentSpuValidation.isValid === true && (
                  <p className="text-xs text-green-600 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {formData.parent_spu.trim() === formData.spu.trim() 
                      ? '设置为根SPU' 
                      : '父SPU验证通过'
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SKU管理 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">
              <Tag className="inline h-5 w-5 mr-2" />
              关联SKU
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            {/* 添加SKU */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSku())}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={formData.spu ? `输入SKU编号 (格式: ${formData.spu}-xxx)` : "请先输入SPU编号"}
                />
                <button
                  type="button"
                  onClick={handleAddSku}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  添加
                </button>
              </div>
              <p className="text-xs text-slate-500">
                SKU命名规则：必须以SPU为前缀，用短横线分隔。
                {formData.spu && (
                  <span className="text-blue-600 font-medium">
                    示例：{formData.spu}-S, {formData.spu}-M, {formData.spu}-L
                  </span>
                )}
              </p>
            </div>

            {/* SKU列表 */}
            {formData.skus.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-700">已添加的SKU:</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.skus.map((sku, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {sku}
                      <button
                        type="button"
                        onClick={() => handleRemoveSku(index)}
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Tag className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                <p>暂无关联的SKU</p>
                <p className="text-sm">请在上方输入框中添加SKU</p>
              </div>
            )}
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? '保存中...' : (isEdit ? '更新SPU' : '创建SPU')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SPUFormPage;
