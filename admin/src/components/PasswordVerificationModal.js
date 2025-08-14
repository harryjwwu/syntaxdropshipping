import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { AlertTriangle, Lock, X } from 'lucide-react';

const PasswordVerificationModal = forwardRef(({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "安全验证", 
  message = "此操作需要管理员二次密码验证",
  actionType = "执行操作",
  loading = false 
}, ref) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('请输入验证密码');
      setShowError(true);
      return;
    }
    setError('');
    setShowError(false);
    onConfirm(password);
  };

  const handleClose = () => {
    if (loading) return; // 防止在验证过程中关闭
    setPassword('');
    setError('');
    setShowError(false);
    onClose();
  };

  // 显示错误信息的函数
  const showErrorMessage = (message) => {
    setError(message);
    setShowError(true);
    // 3秒后自动隐藏错误信息
    setTimeout(() => {
      setShowError(false);
    }, 3000);
  };

  // 清空密码的函数
  const clearPassword = () => {
    setPassword('');
    setError('');
    setShowError(false);
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    showError: showErrorMessage,
    clearPassword: clearPassword
  }));

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !loading) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">{message}</p>
          
          {/* 错误提示区域 */}
          {showError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center justify-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                </div>
                <div className="ml-2">
                  <p className="text-sm text-red-800 text-center font-medium">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="verification-password" className="block text-sm font-medium text-slate-700 mb-2">
                管理员验证密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="verification-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="请输入验证密码"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading || !password.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    验证中...
                  </div>
                ) : (
                  actionType
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

PasswordVerificationModal.displayName = 'PasswordVerificationModal';

export default PasswordVerificationModal;
