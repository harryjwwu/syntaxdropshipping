import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, DollarSign, Globe, Package, Calculator, CheckCircle, XCircle, Loader } from 'lucide-react';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

const SPUQuoteFormPage = () => {
  const navigate = useNavigate();
  const { id: quoteId } = useParams();
  const location = useLocation();
  const isEdit = !!quoteId;
  const isCopy = location.state?.isCopy || false;
  const copyData = location.state?.copyData;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [spuList, setSpuList] = useState([]);
  const [countries, setCountries] = useState([]);
  
  // 从localStorage获取上次的客户ID（仅用于非复制模式的默认值）
  const getLastClientId = () => {
    try {
      return localStorage.getItem('spu_quotes_last_client_id') || '';
    } catch (error) {
      return '';
    }
  };
  
  // SPU验证状态
  const [spuValidation, setSpuValidation] = useState({
    isValidating: false,
    isValid: null, // null: 未验证, true: 有效, false: 无效
    error: '',
    spuInfo: null // 存储SPU详细信息
  });
  
  const [formData, setFormData] = useState(() => {
    // 如果是复制模式，使用复制的数据（不使用缓存）
    if (isCopy && copyData) {
      return {
        spu: copyData.spu || '',
        dxm_client_id: copyData.dxm_client_id || '',
        country_code: copyData.country_code || '',
        product_cost: copyData.product_cost || '',
        shipping_cost: copyData.shipping_cost || '',
        packing_cost: copyData.packing_cost || '',
        vat_cost: copyData.vat_cost || '',
        quantity: copyData.quantity || 1,
        total_price: copyData.total_price || ''
      };
    }
    
    // 新增模式：支持SPU预填充（从SPU详情页进入）
    const prefillSpu = location.state?.prefillSpu || '';
    return {
      spu: prefillSpu,
      dxm_client_id: getLastClientId(), // 仅初始状态使用缓存
      country_code: '',
      product_cost: '',
      shipping_cost: '',
      packing_cost: '',
      vat_cost: '',
      quantity: 1,
      total_price: ''
    };
  });

  // 获取SPU列表
  const fetchSpuList = async () => {
    try {
      const response = await adminAPI.getSpus({ limit: 1000 });
      setSpuList(response.data.data || []);
    } catch (error) {
      console.error('获取SPU列表失败:', error);
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

  // 验证SPU是否存在
  const validateSpu = async (spuValue) => {
    // 如果为空，重置验证状态
    if (!spuValue || !spuValue.trim()) {
      setSpuValidation({
        isValidating: false,
        isValid: null,
        error: '',
        spuInfo: null
      });
      return;
    }

    setSpuValidation({
      isValidating: true,
      isValid: null,
      error: '',
      spuInfo: null
    });

    try {
      // 检查SPU是否存在
      const response = await adminAPI.getSpu(spuValue.trim());
      if (response.success && response.data) {
        setSpuValidation({
          isValidating: false,
          isValid: true,
          error: '',
          spuInfo: response.data
        });
      } else {
        setSpuValidation({
          isValidating: false,
          isValid: false,
          error: 'SPU不存在',
          spuInfo: null
        });
      }
    } catch (error) {
      setSpuValidation({
        isValidating: false,
        isValid: false,
        error: 'SPU不存在',
        spuInfo: null
      });
    }
  };

  // SPU输入变化处理（带防抖）
  const handleSpuChange = (value) => {
    setFormData(prev => ({ ...prev, spu: value }));
    
    // 清除之前的定时器
    if (window.spuValidationTimer) {
      clearTimeout(window.spuValidationTimer);
    }
    
    // 设置新的定时器，500ms后验证
    window.spuValidationTimer = setTimeout(() => {
      validateSpu(value);
    }, 500);
  };

  // 获取报价详情（编辑模式）
  const fetchQuoteDetail = async () => {
    if (!quoteId) return;
    
    try {
      setLoading(true);
      const response = await adminAPI.getSpuQuote(quoteId);
      const quoteData = response.data;
      
      setFormData({
        spu: quoteData.spu || '',
        dxm_client_id: quoteData.dxm_client_id || '',
        country_code: quoteData.country_code || '',
        product_cost: quoteData.product_cost || '',
        shipping_cost: quoteData.shipping_cost || '',
        packing_cost: quoteData.packing_cost || '',
        vat_cost: quoteData.vat_cost || '',
        quantity: quoteData.quantity || 1,
        total_price: quoteData.total_price || ''
      });
      
      // 验证SPU（编辑模式下）
      if (quoteData.spu) {
        validateSpu(quoteData.spu);
      }
    } catch (error) {
      console.error('获取报价详情失败:', error);
      toast.error('获取报价详情失败');
      navigate('/spu-quotes');
    } finally {
      setLoading(false);
    }
  };

  // 初始化
  useEffect(() => {
    fetchSpuList();
    fetchCountries();
    if (isEdit) {
      fetchQuoteDetail();
    } else if (isCopy && copyData?.spu) {
      // 复制模式下验证SPU
      validateSpu(copyData.spu);
    } else if (location.state?.prefillSpu) {
      // 从SPU详情页进入，验证预填充的SPU
      validateSpu(location.state.prefillSpu);
    }
  }, [isEdit, quoteId, isCopy, copyData, location.state]);

  // 处理表单字段变化
  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // 自动计算总价
      if (['product_cost', 'shipping_cost', 'packing_cost', 'vat_cost'].includes(field)) {
        const productCost = parseFloat(newData.product_cost) || 0;
        const shippingCost = parseFloat(newData.shipping_cost) || 0;
        const packingCost = parseFloat(newData.packing_cost) || 0;
        const vatCost = parseFloat(newData.vat_cost) || 0;
        
        newData.total_price = (productCost + shippingCost + packingCost + vatCost).toFixed(2);
      }
      
      return newData;
    });
  };

  // 验证表单
  const validateForm = () => {
    if (!formData.spu.trim()) {
      toast.error('请输入SPU编号');
      return false;
    }
    
    // 检查SPU验证状态
    if (spuValidation.isValidating) {
      toast.error('正在验证SPU，请稍候...');
      return false;
    }
    
    if (spuValidation.isValid === false) {
      toast.error(`SPU验证失败: ${spuValidation.error}`);
      return false;
    }
    
    if (spuValidation.isValid !== true) {
      toast.error('请等待SPU验证完成');
      return false;
    }
    
    if (!formData.country_code) {
      toast.error('请选择国家');
      return false;
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      toast.error('数量必须大于0');
      return false;
    }
    
    const costs = [formData.product_cost, formData.shipping_cost, formData.packing_cost, formData.vat_cost];
    if (costs.some(cost => cost === '' || isNaN(cost) || parseFloat(cost) < 0)) {
      toast.error('所有成本项必须为非负数');
      return false;
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
        product_cost: parseFloat(formData.product_cost),
        shipping_cost: parseFloat(formData.shipping_cost),
        packing_cost: parseFloat(formData.packing_cost),
        vat_cost: parseFloat(formData.vat_cost),
        quantity: parseInt(formData.quantity),
        total_price: parseFloat(formData.total_price)
      };
      
      if (isEdit) {
        await adminAPI.updateSpuQuote(quoteId, submitData);
        toast.success('报价更新成功');
      } else {
        await adminAPI.createSpuQuote(submitData);
        toast.success('报价创建成功');
      }
      
      navigate('/spu-quotes');
    } catch (error) {
      console.error('保存报价失败:', error);
      toast.error(error.response?.data?.message || '保存报价失败');
    } finally {
      setSaving(false);
    }
  };

  // 返回列表
  const handleBack = () => {
    navigate('/spu-quotes');
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
              {isEdit ? '编辑报价' : isCopy ? '复制报价' : '新增报价'}
            </h1>
            <p className="text-slate-600">
              {isEdit ? '修改SPU报价信息' : isCopy ? '基于现有报价创建新报价' : '为SPU创建新的报价'}
            </p>
          </div>
        </div>
      </div>

      {/* 复制模式提示 */}
      {isCopy && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-800">复制模式</p>
              <p className="text-sm text-blue-600">已复制现有报价数据，您可以修改任何字段后保存为新报价</p>
            </div>
          </div>
        </div>
      )}

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">基本信息</h3>
          </div>
          
          <div className="p-6 space-y-6">
            {/* 客户ID和SPU */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="dxm_client_id" className="block text-sm font-medium text-slate-700 mb-2">
                  客户ID *
                </label>
                <input
                  id="dxm_client_id"
                  type="text"
                  value={formData.dxm_client_id}
                  onChange={(e) => handleFieldChange('dxm_client_id', e.target.value)}
                  disabled={isEdit} // 编辑时不允许修改客户ID，复制时允许修改
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="输入客户店小秘ID"
                  required
                />
                {isEdit && (
                  <p className="mt-1 text-xs text-slate-500">编辑时不能修改客户ID</p>
                )}
              </div>
              
              <div>
                <label htmlFor="spu" className="block text-sm font-medium text-slate-700 mb-2">
                  <Package className="inline h-4 w-4 mr-1" />
                  输入SPU编号 *
                </label>
                <div className="relative">
                  <input
                    id="spu"
                    type="text"
                    value={formData.spu}
                    onChange={(e) => handleSpuChange(e.target.value)}
                    disabled={isEdit} // 编辑时不允许修改SPU，复制时允许修改
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                      formData.spu && formData.spu.trim()
                        ? spuValidation.isValid === true
                          ? 'border-green-300 bg-green-50'
                          : spuValidation.isValid === false
                          ? 'border-red-300 bg-red-50'
                          : 'border-yellow-300 bg-yellow-50'
                        : 'border-slate-300'
                    }`}
                    placeholder="输入SPU编号"
                    required
                  />
                  {/* 验证状态图标 */}
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {formData.spu && formData.spu.trim() && (
                      <>
                        {spuValidation.isValidating && (
                          <Loader className="h-4 w-4 text-yellow-500 animate-spin" />
                        )}
                        {!spuValidation.isValidating && spuValidation.isValid === true && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {!spuValidation.isValidating && spuValidation.isValid === false && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </>
                    )}
                  </div>
                </div>
                {/* 提示信息 */}
                <div className="mt-1">
                  {isEdit && (
                    <p className="text-xs text-slate-500">编辑时不能修改SPU编号</p>
                  )}
                  {formData.spu && formData.spu.trim() && spuValidation.error && (
                    <p className="text-xs text-red-600 flex items-center">
                      <XCircle className="h-3 w-3 mr-1" />
                      {spuValidation.error}
                    </p>
                  )}
                  {formData.spu && formData.spu.trim() && spuValidation.isValid === true && spuValidation.spuInfo && (
                    <p className="text-xs text-green-600 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      SPU验证通过: {spuValidation.spuInfo.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 选择国家和数量 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="country_code" className="block text-sm font-medium text-slate-700 mb-2">
                  <Globe className="inline h-4 w-4 mr-1" />
                  选择国家 *
                </label>
                <select
                  id="country_code"
                  value={formData.country_code}
                  onChange={(e) => handleFieldChange('country_code', e.target.value)}
                  disabled={isEdit} // 编辑时不允许修改国家，复制时允许修改
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">请选择国家</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name_cn || country.name} ({country.code})
                    </option>
                  ))}
                </select>
                {isEdit && (
                  <p className="mt-1 text-xs text-slate-500">编辑时不能修改国家</p>
                )}
              </div>
              
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-2">
                  数量 *
                </label>
                <input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleFieldChange('quantity', e.target.value)}
                  disabled={isEdit} // 编辑时不允许修改数量，复制时允许修改
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="输入数量"
                  min="1"
                  required
                />
                {isEdit && (
                  <p className="mt-1 text-xs text-slate-500">编辑时不能修改数量</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 成本信息 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">
              <DollarSign className="inline h-5 w-5 mr-2" />
              成本信息
            </h3>
            <p className="text-sm text-slate-600 mt-1">所有金额单位为美元 (USD)</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* 成本项 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="product_cost" className="block text-sm font-medium text-slate-700 mb-2">
                  产品成本 * (USD)
                </label>
                <input
                  id="product_cost"
                  type="number"
                  step="0.01"
                  value={formData.product_cost}
                  onChange={(e) => handleFieldChange('product_cost', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="shipping_cost" className="block text-sm font-medium text-slate-700 mb-2">
                  运费 * (USD)
                </label>
                <input
                  id="shipping_cost"
                  type="number"
                  step="0.01"
                  value={formData.shipping_cost}
                  onChange={(e) => handleFieldChange('shipping_cost', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="packing_cost" className="block text-sm font-medium text-slate-700 mb-2">
                  包装费 * (USD)
                </label>
                <input
                  id="packing_cost"
                  type="number"
                  step="0.01"
                  value={formData.packing_cost}
                  onChange={(e) => handleFieldChange('packing_cost', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="vat_cost" className="block text-sm font-medium text-slate-700 mb-2">
                  税费 * (USD)
                </label>
                <input
                  id="vat_cost"
                  type="number"
                  step="0.01"
                  value={formData.vat_cost}
                  onChange={(e) => handleFieldChange('vat_cost', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0.00"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* 总价显示 */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calculator className="h-5 w-5 text-slate-500 mr-2" />
                  <span className="text-sm font-medium text-slate-700">自动计算总价:</span>
                </div>
                <div className="text-xl font-bold text-primary-600">
                  ${formData.total_price || '0.00'}
                </div>
              </div>
              
              {/* 成本明细 */}
              <div className="mt-3 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>产品成本:</span>
                  <span>${formData.product_cost || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>运费:</span>
                  <span>${formData.shipping_cost || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>包装费:</span>
                  <span>${formData.packing_cost || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>税费:</span>
                  <span>${formData.vat_cost || '0.00'}</span>
                </div>
                <hr className="my-1" />
                <div className="flex justify-between font-medium">
                  <span>总计:</span>
                  <span>${formData.total_price || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* 手动调整总价 */}
            <div>
              <label htmlFor="total_price" className="block text-sm font-medium text-slate-700 mb-2">
                总价 (USD) - 可手动调整
              </label>
              <input
                id="total_price"
                type="number"
                step="0.01"
                value={formData.total_price}
                onChange={(e) => handleFieldChange('total_price', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
                min="0"
              />
              <p className="mt-1 text-xs text-slate-500">
                总价会根据各项成本自动计算，您也可以手动调整最终价格
              </p>
            </div>
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
            {saving ? '保存中...' : (isEdit ? '更新报价' : '创建报价')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SPUQuoteFormPage;
