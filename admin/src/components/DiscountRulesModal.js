import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';

const DiscountRulesModal = ({ isOpen, onClose, user }) => {
  const [discountRules, setDiscountRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 表单数据
  const [formData, setFormData] = useState({
    min_quantity: '',
    max_quantity: '',
    discount_rate: ''
  });
  
  // 错误状态
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // 获取折扣规则
  const fetchDiscountRules = async () => {
    if (!user?.dxm_client_id) return;
    
    try {
      setLoading(true);
      const response = await adminAPI.getUserDiscountRules(user.dxm_client_id);
      if (response.success) {
        setDiscountRules(response.data || []);
      } else {
        console.error('获取折扣规则失败:', response.error || response.message);
        setError(response.error || response.message || '获取折扣规则失败');
      }
    } catch (error) {
      console.error('获取折扣规则失败:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || '获取折扣规则失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 验证表单
  const validateForm = () => {
    const errors = {};
    const minQty = parseInt(formData.min_quantity);
    const maxQty = parseInt(formData.max_quantity);
    const discountRate = parseFloat(formData.discount_rate);

    if (!formData.min_quantity || minQty < 1) {
      errors.min_quantity = '最小数量必须大于0';
    }

    if (!formData.max_quantity || maxQty < 1) {
      errors.max_quantity = '最大数量必须大于0';
    }

    if (minQty && maxQty && minQty > maxQty) {
      errors.max_quantity = '最大数量必须大于等于最小数量';
    }

    if (!formData.discount_rate || discountRate <= 0 || discountRate > 1) {
      errors.discount_rate = '折扣率必须在0-1之间';
    }

    // 检查数量范围是否与现有规则冲突
    const conflictRule = discountRules.find(rule => {
      if (editingRule && rule.id === editingRule.id) return false;
      return (
        (minQty >= rule.min_quantity && minQty <= rule.max_quantity) ||
        (maxQty >= rule.min_quantity && maxQty <= rule.max_quantity) ||
        (minQty <= rule.min_quantity && maxQty >= rule.max_quantity)
      );
    });

    if (conflictRule) {
      errors.quantity_range = `数量范围与现有规则冲突: ${conflictRule.min_quantity}-${conflictRule.max_quantity}件`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      min_quantity: '',
      max_quantity: '',
      discount_rate: ''
    });
    setFormErrors({});
    setError('');
    setEditingRule(null);
    setShowAddForm(false);
  };

  // 开始添加规则
  const handleAddRule = () => {
    resetForm();
    setShowAddForm(true);
  };

  // 开始编辑规则
  const handleEditRule = (rule) => {
    setFormData({
      min_quantity: rule.min_quantity.toString(),
      max_quantity: rule.max_quantity.toString(),
      discount_rate: rule.discount_rate.toString()
    });
    setEditingRule(rule);
    setShowAddForm(true);
    setFormErrors({});
    setError('');
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const payload = {
        min_quantity: parseInt(formData.min_quantity),
        max_quantity: parseInt(formData.max_quantity),
        discount_rate: parseFloat(formData.discount_rate)
      };

      let response;
      if (editingRule) {
        // 更新规则
        response = await adminAPI.updateUserDiscountRule(
          user.dxm_client_id,
          editingRule.id,
          payload
        );
      } else {
        // 创建规则
        response = await adminAPI.createUserDiscountRule(
          user.dxm_client_id,
          payload
        );
      }

      if (response.success) {
        await fetchDiscountRules();
        resetForm();
      } else {
        setError(response.error || response.message || '操作失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      setError(error.response?.data?.error || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除规则
  const handleDeleteRule = async (rule) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`确定要删除数量范围 ${rule.min_quantity}-${rule.max_quantity} 件的折扣规则吗？`)) {
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await adminAPI.deleteUserDiscountRule(
        user.dxm_client_id,
        rule.id
      );
      
      if (response.success) {
        await fetchDiscountRules();
      } else {
        setError(response.error || response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      setError(error.response?.data?.error || '删除失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 格式化折扣率显示
  const formatDiscountRate = (rate) => {
    return (rate * 10).toFixed(1) + '折';
  };

  // 监听弹窗打开
  useEffect(() => {
    if (isOpen && user?.dxm_client_id) {
      // 检查是否有管理员token
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        setError('请先登录管理后台');
        return;
      }
      fetchDiscountRules();
    } else if (isOpen) {
      resetForm();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            设置订单折扣 - {user?.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 用户信息 */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">用户邮箱：</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div>
              <span className="text-gray-600">店小秘ID：</span>
              <span className="font-medium">{user?.dxm_client_id || '未绑定'}</span>
            </div>
          </div>
        </div>

        {/* 未绑定店小秘提示 */}
        {!user?.dxm_client_id && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-800">该用户未绑定店小秘，无法设置折扣规则</span>
            </div>
          </div>
        )}

        {user?.dxm_client_id && (
          <>
                    {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            <div className="font-medium">操作失败</div>
            <div className="text-sm mt-1">{error}</div>
            {error.includes('Token') && (
              <div className="text-xs mt-2 text-red-500">
                提示：请确保已正确登录管理后台
              </div>
            )}
          </div>
        )}

            {/* 添加按钮 */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">折扣规则列表</h3>
              {!showAddForm && (
                <button
                  onClick={handleAddRule}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  添加规则
                </button>
              )}
            </div>

            {/* 添加/编辑表单 */}
            {showAddForm && (
              <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="text-md font-medium mb-4">
                  {editingRule ? '编辑折扣规则' : '添加折扣规则'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最小数量 *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData({...formData, min_quantity: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.min_quantity ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="例如：1"
                    />
                    {formErrors.min_quantity && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.min_quantity}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最大数量 *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_quantity}
                      onChange={(e) => setFormData({...formData, max_quantity: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.max_quantity ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="例如：3"
                    />
                    {formErrors.max_quantity && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.max_quantity}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      折扣率 * (0-1之间)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      max="1"
                      step="0.01"
                      value={formData.discount_rate}
                      onChange={(e) => setFormData({...formData, discount_rate: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.discount_rate ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="例如：0.9（表示9折）"
                    />
                    {formErrors.discount_rate && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.discount_rate}</p>
                    )}
                  </div>
                </div>

                {formErrors.quantity_range && (
                  <p className="text-red-500 text-sm mb-4">{formErrors.quantity_range}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? '保存中...' : (editingRule ? '更新规则' : '添加规则')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>
            )}

            {/* 规则列表 */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">加载中...</p>
              </div>
            ) : discountRules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无折扣规则，点击上方"添加规则"按钮开始设置
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">数量范围</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">折扣率</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">折扣显示</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">创建时间</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {discountRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {rule.min_quantity}-{rule.max_quantity} 件
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {rule.discount_rate}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            {formatDiscountRate(rule.discount_rate)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(rule.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditRule(rule)}
                              disabled={submitting}
                              className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule)}
                              disabled={submitting}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* 说明文字 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">折扣规则说明：</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 折扣基于终端用户在24小时内的总下单件数</li>
            <li>• 数量范围不能重叠，系统会自动检查冲突</li>
            <li>• 折扣率范围：0.01-1.00（例如0.9表示9折）</li>
            <li>• 只有绑定店小秘的用户才能设置折扣规则</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DiscountRulesModal;
