import React, { useState, useEffect } from 'react';
import { Save, CreditCard, Building, Mail, AlertCircle, CheckCircle, Percent } from 'lucide-react';
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

  useEffect(() => {
    fetchPaymentSettings();
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
