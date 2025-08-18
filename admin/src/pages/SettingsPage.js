import React, { useState, useEffect } from 'react';
import { Save, CreditCard, Building, Mail, AlertCircle, CheckCircle, Percent, List, Plus, X, Package } from 'lucide-react';
import { adminAPI } from '../utils/api';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('payment');
  
  // 支付信息状态
  const [paymentSettings, setPaymentSettings] = useState({
    payment_usd_bank_transfer: {
      setting_value: {
        account_number: '',
        holder_name: '',
        support_currency: 'USD',
        bank: '',
        bank_country_region: '',
        bank_address: '',
        account_type: 'Business Account',
        swift_code: '',
        wire_routing_number: '',
        ach_routing_number: '',
        swift_bic: '',
        currency: 'USD',
        is_enabled: true
      }
    },
    payment_eur_bank_transfer: {
      setting_value: {
        account_number_iban: '',
        holder_name: '',
        support_currency: 'EUR',
        bank: '',
        bank_country_region: '',
        bank_address: '',
        account_type: 'Business Account',
        swift_bic: '',
        currency: 'EUR',
        is_enabled: true
      }
    },
    payment_paypal: {
      setting_value: {
        account_number: '',
        the_name: '',
        currency: 'USD',
        is_enabled: true
      }
    },
    others_currency_tooltip: {
      setting_value: {
        message: '如需其他币种，请联系我们',
        is_enabled: true
      }
    },
    commission_rules: {
      setting_value: {
        first_level_rate: 2.0,
        description: '只支持一层推荐返佣：一级返佣 2%\nA 推荐 B → B 下单后支付金额的 2% 给 A\nB 推荐 C → C 下单后支付金额的 2% 给 B，C的付款金额不与A关联',
        is_enabled: true
      }
    }
  });

  // 枚举值设置状态
  const [enumSettings, setEnumSettings] = useState({});
  const [editingEnum, setEditingEnum] = useState(null); // 当前编辑的枚举设置
  const [newEnumValue, setNewEnumValue] = useState(''); // 新枚举值输入

  // 获取支付信息设置
  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPaymentSettings();
      if (response.success) {
        setPaymentSettings(prevSettings => ({
          ...prevSettings,
          ...response.data
        }));
      }
    } catch (error) {
      console.error('获取支付设置失败:', error);
      toast.error('获取支付设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取枚举值设置
  const fetchEnumSettings = async () => {
    try {
      console.log('🔍 开始获取枚举值设置...');
      const response = await adminAPI.getEnumSettings();
      console.log('📋 枚举值设置响应:', response);
      
      if (response.success) {
        // 如果后端返回空数据，设置默认值
        const enumData = response.data || {};
        
        // 设置默认的国家代码
        if (!enumData.country_codes) {
          enumData.country_codes = {
            setting_value: ['SE', 'FI', 'DK', 'NO', 'DE', 'NL', 'GB'],
            description: '系统支持的国家代码列表'
          };
        }
        
        // 设置默认的物流方式
        if (!enumData.logistics_methods) {
          enumData.logistics_methods = {
            setting_value: ['海运', '空运', '快递', '陆运'],
            description: '系统支持的物流方式列表'
          };
        }
        
        console.log('📋 设置枚举值数据:', enumData);
        setEnumSettings(enumData);
      }
    } catch (error) {
      console.error('获取枚举值设置失败:', error);
      
      // 如果获取失败，设置默认值
      const defaultEnumSettings = {
        country_codes: {
          setting_value: ['SE', 'FI', 'DK', 'NO', 'DE', 'NL', 'GB'],
          description: '系统支持的国家代码列表'
        },
        logistics_methods: {
          setting_value: ['海运', '空运', '快递', '陆运'],
          description: '系统支持的物流方式列表'
        }
      };
      
      console.log('📋 使用默认枚举值设置:', defaultEnumSettings);
      setEnumSettings(defaultEnumSettings);
      
      toast.error('获取枚举值设置失败，已加载默认配置');
    }
  };

  useEffect(() => {
    fetchPaymentSettings();
    fetchEnumSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 更新支付信息字段
  const updatePaymentField = (paymentType, field, value) => {
    setPaymentSettings(prev => ({
      ...prev,
      [paymentType]: {
        ...prev[paymentType],
        setting_value: {
          ...prev[paymentType].setting_value,
          [field]: value
        }
      }
    }));
  };

  // 保存支付信息
  const savePaymentSettings = async (paymentType) => {
    try {
      setSaving(true);
      const type = paymentType.replace('payment_', '');
      const paymentInfo = paymentSettings[paymentType].setting_value;
      
      const response = await adminAPI.updatePaymentSettings(type, paymentInfo);
      if (response.success) {
        toast.success('支付信息保存成功');
        // 更新本地状态
        setPaymentSettings(prev => ({
          ...prev,
          [paymentType]: response.data
        }));
      }
    } catch (error) {
      console.error('保存支付信息失败:', error);
      const errorMessage = error.response?.data?.message || '保存支付信息失败';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // 枚举值设置处理函数
  const saveEnumSetting = async (key, values, description) => {
    try {
      setSaving(true);
      const response = await adminAPI.updateEnumSetting(key, values, description);
      if (response.success) {
        toast.success('枚举值设置保存成功');
        // 更新本地状态
        setEnumSettings(prev => ({
          ...prev,
          [key]: response.data
        }));
        setEditingEnum(null);
      }
    } catch (error) {
      console.error('保存枚举值设置失败:', error);
      toast.error('保存枚举值设置失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const addEnumValue = (key, value) => {
    if (!value.trim()) return;
    
    const currentValues = enumSettings[key]?.setting_value || [];
    if (currentValues.includes(value.trim())) {
      toast.error('该值已存在');
      return;
    }
    
    const newValues = [...currentValues, value.trim()];
    setEnumSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        setting_value: newValues
      }
    }));
    setNewEnumValue('');
  };

  const removeEnumValue = (key, index) => {
    const currentValues = enumSettings[key]?.setting_value || [];
    const newValues = currentValues.filter((_, i) => i !== index);
    setEnumSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        setting_value: newValues
      }
    }));
  };

  // 渲染枚举值设置
  const renderEnumSettings = () => {
    return (
      <div className="space-y-6">
        {/* 国家代码设置 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <List className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900">国家代码设置</h3>
                <p className="text-sm text-slate-500">配置系统支持的国家代码列表</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* 当前国家代码列表 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                当前已设置的值
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {(enumSettings.country_codes?.setting_value || []).map((code, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {code}
                    <button
                      onClick={() => removeEnumValue('country_codes', index)}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 添加新国家代码 */}
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={editingEnum === 'country_codes' ? newEnumValue : ''}
                onChange={(e) => setNewEnumValue(e.target.value.toUpperCase())}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addEnumValue('country_codes', newEnumValue);
                  }
                }}
                onFocus={() => setEditingEnum('country_codes')}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入国家代码 (如: US, CN, JP)"
                maxLength="3"
              />
              <button
                onClick={() => addEnumValue('country_codes', newEnumValue)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-2">使用说明</h4>
                  <div className="text-sm text-blue-700">
                    <p className="mb-2">国家代码将在以下地方使用：</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>SPU报价管理中的国家选择</li>
                      <li>用户注册时的国家选择</li>
                      <li>订单管理中的国家筛选</li>
                    </ul>
                    <p className="mt-2 text-xs">建议使用ISO 3166-1 alpha-2标准的两位国家代码。当前已设置的值：SE, FI, DK, NO, DE, NL, GB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => saveEnumSetting(
                'country_codes', 
                enumSettings.country_codes?.setting_value || [],
                '系统支持的国家代码列表'
              )}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>

        {/* 物流方式设置 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900">物流方式设置</h3>
                <p className="text-sm text-slate-500">配置系统支持的物流方式列表</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* 当前物流方式列表 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                支持的物流方式
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {(enumSettings.logistics_methods?.setting_value || []).map((method, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                  >
                    {method}
                    <button
                      onClick={() => removeEnumValue('logistics_methods', index)}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-600 hover:bg-green-200 hover:text-green-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 添加新物流方式 */}
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={editingEnum === 'logistics_methods' ? newEnumValue : ''}
                onChange={(e) => setNewEnumValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addEnumValue('logistics_methods', newEnumValue);
                  }
                }}
                onFocus={() => setEditingEnum('logistics_methods')}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="输入物流方式 (如: 海运, 空运, 快递)"
                maxLength="50"
              />
              <button
                onClick={() => addEnumValue('logistics_methods', newEnumValue)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-green-800 mb-2">使用说明</h4>
                  <div className="text-sm text-green-700">
                    <p className="mb-2">物流方式将在以下地方使用：</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>SPU创建和编辑时的物流方式选择</li>
                      <li>SPU报价管理中的物流方式筛选</li>
                      <li>订单管理中的物流方式显示</li>
                    </ul>
                    <p className="mt-2 text-xs">常见物流方式：海运、空运、快递、陆运等</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => saveEnumSetting(
                'logistics_methods', 
                enumSettings.logistics_methods?.setting_value || [],
                '系统支持的物流方式列表'
              )}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>

        {/* 快速设置预设值 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900">快速设置预设值</h3>
              <p className="text-sm text-slate-500">一键设置常用的枚举值</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 国家代码预设 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700">国家代码预设</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const europeCountries = ['SE', 'FI', 'DK', 'NO', 'DE', 'NL', 'GB'];
                    setEnumSettings(prev => ({
                      ...prev,
                      country_codes: {
                        ...prev.country_codes,
                        setting_value: europeCountries
                      }
                    }));
                    toast.success('已设置欧洲国家代码');
                  }}
                  className="w-full text-left px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 focus:ring-2 focus:ring-blue-500"
                >
                  <div className="font-medium text-slate-900">欧洲主要国家</div>
                  <div className="text-xs text-slate-500">SE, FI, DK, NO, DE, NL, GB</div>
                </button>
                <button
                  onClick={() => {
                    const allCountries = ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'AU', 'JP', 'KR', 'CN', 'SG', 'HK', 'TW'];
                    setEnumSettings(prev => ({
                      ...prev,
                      country_codes: {
                        ...prev.country_codes,
                        setting_value: allCountries
                      }
                    }));
                    toast.success('已设置全球主要国家代码');
                  }}
                  className="w-full text-left px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 focus:ring-2 focus:ring-blue-500"
                >
                  <div className="font-medium text-slate-900">全球主要国家</div>
                  <div className="text-xs text-slate-500">包含北美、欧洲、亚太等20个国家</div>
                </button>
              </div>
            </div>

            {/* 物流方式预设 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700">物流方式预设</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const commonLogistics = ['海运', '空运', '快递', '陆运'];
                    setEnumSettings(prev => ({
                      ...prev,
                      logistics_methods: {
                        ...prev.logistics_methods,
                        setting_value: commonLogistics
                      }
                    }));
                    toast.success('已设置常用物流方式');
                  }}
                  className="w-full text-left px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 focus:ring-2 focus:ring-green-500"
                >
                  <div className="font-medium text-slate-900">常用物流方式</div>
                  <div className="text-xs text-slate-500">海运, 空运, 快递, 陆运</div>
                </button>
                <button
                  onClick={() => {
                    const detailedLogistics = ['海运整柜', '海运拼箱', '空运普通', '空运加急', 'DHL', 'UPS', 'FedEx', '顺丰', 'EMS', '中欧班列', '陆运整车', '陆运零担'];
                    setEnumSettings(prev => ({
                      ...prev,
                      logistics_methods: {
                        ...prev.logistics_methods,
                        setting_value: detailedLogistics
                      }
                    }));
                    toast.success('已设置详细物流方式');
                  }}
                  className="w-full text-left px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 focus:ring-2 focus:ring-green-500"
                >
                  <div className="font-medium text-slate-900">详细物流方式</div>
                  <div className="text-xs text-slate-500">包含具体的承运商和服务类型</div>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  // 渲染USD银行转账设置
  const renderUSDBank = () => {
    const settings = paymentSettings.payment_usd_bank_transfer.setting_value;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900">USD 银行转账</h3>
              <p className="text-sm text-slate-500">配置USD银行转账收款信息</p>
            </div>
          </div>
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.is_enabled}
                onChange={(e) => updatePaymentField('payment_usd_bank_transfer', 'is_enabled', e.target.checked)}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.is_enabled ? 'bg-blue-600' : 'bg-slate-200'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.is_enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.account_number}
              onChange={(e) => updatePaymentField('payment_usd_bank_transfer', 'account_number', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="20000013059388"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Holder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.holder_name}
              onChange={(e) => updatePaymentField('payment_usd_bank_transfer', 'holder_name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Syntax International Limited"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Support Currency <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.support_currency}
              onChange={(e) => updatePaymentField('payment_usd_bank_transfer', 'support_currency', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="USD"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bank <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.bank}
              onChange={(e) => updatePaymentField('payment_usd_bank_transfer', 'bank', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="JP MORGAN CHASE BANK, N.A."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bank Country/Region <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.bank_country_region}
              onChange={(e) => updatePaymentField('payment_usd_bank_transfer', 'bank_country_region', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="United States"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Account Type <span className="text-red-500">*</span>
            </label>
            <select
              value={settings.account_type}
              onChange={(e) => updatePaymentField('payment_usd_bank_transfer', 'account_type', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Business Account">Business Account</option>
              <option value="Personal Account">Personal Account</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Swift Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.swift_code}
              onChange={(e) => updatePaymentField('payment_usd_bank_transfer', 'swift_code', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="CHASUS33"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Wire Routing Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.wire_routing_number}
              onChange={(e) => updatePaymentField('payment_usd_bank_transfer', 'wire_routing_number', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="021000021"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ach Routing Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.ach_routing_number}
              onChange={(e) => updatePaymentField('payment_usd_bank_transfer', 'ach_routing_number', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="028000024"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              SWIFT/BIC <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.swift_bic}
              onChange={(e) => updatePaymentField('payment_usd_bank_transfer', 'swift_bic', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="CHASUS33"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bank Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={settings.bank_address}
              onChange={(e) => updatePaymentField('payment_usd_bank_transfer', 'bank_address', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="4 NEW YORK PLAZA FLOOR 15, New York, United States"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => savePaymentSettings('payment_usd_bank_transfer')}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    );
  };

  // 渲染EUR银行转账设置
  const renderEURBank = () => {
    const settings = paymentSettings.payment_eur_bank_transfer.setting_value;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <Building className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900">EUR 银行转账</h3>
              <p className="text-sm text-slate-500">配置EUR银行转账收款信息</p>
            </div>
          </div>
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.is_enabled}
                onChange={(e) => updatePaymentField('payment_eur_bank_transfer', 'is_enabled', e.target.checked)}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.is_enabled ? 'bg-green-600' : 'bg-slate-200'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.is_enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Account Number/IBAN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.account_number_iban}
              onChange={(e) => updatePaymentField('payment_eur_bank_transfer', 'account_number_iban', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="IE36CHAS93090301129986"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Holder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.holder_name}
              onChange={(e) => updatePaymentField('payment_eur_bank_transfer', 'holder_name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Syntax International Limited"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Support Currency <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.support_currency}
              onChange={(e) => updatePaymentField('payment_eur_bank_transfer', 'support_currency', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="EUR"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bank <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.bank}
              onChange={(e) => updatePaymentField('payment_eur_bank_transfer', 'bank', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="J.P. Morgan Bank Luxembourg S.A., Dublin Branch"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bank Country/Region <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.bank_country_region}
              onChange={(e) => updatePaymentField('payment_eur_bank_transfer', 'bank_country_region', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Ireland (IE)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Account Type <span className="text-red-500">*</span>
            </label>
            <select
              value={settings.account_type}
              onChange={(e) => updatePaymentField('payment_eur_bank_transfer', 'account_type', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="Business Account">Business Account</option>
              <option value="Personal Account">Personal Account</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              SWIFT/BIC <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.swift_bic}
              onChange={(e) => updatePaymentField('payment_eur_bank_transfer', 'swift_bic', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="CHASIE4L"
            />
          </div>
          
          <div></div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bank Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={settings.bank_address}
              onChange={(e) => updatePaymentField('payment_eur_bank_transfer', 'bank_address', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="200 Capital Dock 79 Sir John Rogersons Quay Dublin 2 D02 RK57"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => savePaymentSettings('payment_eur_bank_transfer')}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    );
  };

  // 渲染OTHERS货币提示设置
  const renderOthersTooltip = () => {
    const settings = paymentSettings.others_currency_tooltip.setting_value;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg mr-3">
              <AlertCircle className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900">OTHERS 货币提示</h3>
              <p className="text-sm text-slate-500">配置其他货币选项的提示信息</p>
            </div>
          </div>
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.is_enabled}
                onChange={(e) => updatePaymentField('others_currency_tooltip', 'is_enabled', e.target.checked)}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.is_enabled ? 'bg-gray-600' : 'bg-slate-200'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.is_enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              提示信息 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={settings.message}
              onChange={(e) => updatePaymentField('others_currency_tooltip', 'message', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              placeholder="如需其他币种，请联系我们 support@syntaxdropshipping.com"
            />
            <p className="text-xs text-slate-500 mt-1">
              此信息将在用户鼠标悬停在"OTHERS"货币选项时显示
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => savePaymentSettings('others_currency_tooltip')}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    );
  };

  // 渲染佣金规则设置
  const renderCommissionRules = () => {
    const settings = paymentSettings.commission_rules.setting_value;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <Percent className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900">佣金规则设置</h3>
              <p className="text-sm text-slate-500">配置推荐返佣比例和规则</p>
            </div>
          </div>
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.is_enabled}
                onChange={(e) => updatePaymentField('commission_rules', 'is_enabled', e.target.checked)}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.is_enabled ? 'bg-purple-600' : 'bg-slate-200'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.is_enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
            </label>
          </div>
        </div>

        {/* 规则描述 */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-purple-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-purple-800 mb-2">当前佣金规则</h4>
              <div className="text-sm text-purple-700 whitespace-pre-line">
                {settings.description}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              一级返佣比例 (%) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.first_level_rate}
                onChange={(e) => updatePaymentField('commission_rules', 'first_level_rate', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="2.0"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-slate-500 text-sm">%</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              推荐用户消费后，推荐人获得的返佣比例
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              返佣层级
            </label>
            <div className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-slate-600">
              仅支持一层推荐返佣
            </div>
            <p className="text-xs text-slate-500 mt-1">
              目前系统只支持一级推荐返佣，不支持多层级
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => savePaymentSettings('commission_rules')}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    );
  };

  // 渲染PayPal设置
  const renderPayPal = () => {
    const settings = paymentSettings.payment_paypal.setting_value;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <CreditCard className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900">PayPal 支付</h3>
              <p className="text-sm text-slate-500">配置PayPal收款信息</p>
            </div>
          </div>
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.is_enabled}
                onChange={(e) => updatePaymentField('payment_paypal', 'is_enabled', e.target.checked)}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.is_enabled ? 'bg-yellow-600' : 'bg-slate-200'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.is_enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Account Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={settings.account_number}
                onChange={(e) => updatePaymentField('payment_paypal', 'account_number', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="497027829@qq.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              The name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.the_name}
              onChange={(e) => updatePaymentField('payment_paypal', 'the_name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="钟炜"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => savePaymentSettings('payment_paypal')}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900">系统设置</h1>
        <p className="text-slate-600 mt-2">管理系统配置和支付信息设置</p>
      </div>

      {/* 选项卡 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('payment')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              支付信息设置
            </button>
            <button
              onClick={() => setActiveTab('commission')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'commission'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              佣金规则设置
            </button>
            <button
              onClick={() => setActiveTab('enum')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'enum'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              枚举值设置
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              常规设置
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'payment' && (
            <div className="space-y-8">
              {/* 提示信息 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">支付信息配置说明</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>请配置用户充值时显示的支付信息。这些信息将在用户选择对应支付方式时显示。</p>
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>USD Bank Transfer: 美元银行转账收款信息</li>
                        <li>EUR Bank Transfer: 欧元银行转账收款信息</li>
                        <li>PayPal: PayPal收款账户信息</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 支付方式设置 */}
              {renderUSDBank()}
              {renderEURBank()}
              {renderPayPal()}
              {renderOthersTooltip()}
            </div>
          )}

          {activeTab === 'commission' && (
            <div className="space-y-8">
              {/* 佣金规则设置 */}
              {renderCommissionRules()}
            </div>
          )}

          {activeTab === 'enum' && (
            <div className="space-y-8">
              {/* 枚举值设置 */}
              {renderEnumSettings()}
            </div>
          )}

          {activeTab === 'general' && (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <CheckCircle className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">功能开发中</h3>
              <p className="text-slate-500">常规设置功能正在开发中，敬请期待...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
