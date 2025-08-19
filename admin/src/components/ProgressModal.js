import React from 'react';

const ProgressModal = ({ 
  isOpen, 
  title = '处理中...', 
  progress = 0, 
  currentStep = '', 
  totalItems = 0,
  processedItems = 0,
  onCancel = null 
}) => {
  if (!isOpen) return null;

  const progressPercentage = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
      
      {/* 模态框 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* 标题 */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {currentStep && (
              <p className="text-sm text-gray-600 mt-2">{currentStep}</p>
            )}
          </div>

          {/* 进度条 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">进度</span>
              <span className="text-sm font-medium text-gray-900">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            
            {totalItems > 0 && (
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>已处理: {processedItems}</span>
                <span>总计: {totalItems}</span>
              </div>
            )}
          </div>

          {/* 加载动画 */}
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          {/* 取消按钮（可选） */}
          {onCancel && (
            <div className="text-center">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                取消操作
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;
