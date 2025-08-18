import React, { useState, useRef, useEffect } from 'react';
import { Upload, Cloud, X, CheckCircle, AlertCircle, Image } from 'lucide-react';
import { cosDirectUpload } from '../services/cosService';
import toast from 'react-hot-toast';

/**
 * COS直传上传组件
 * 统一使用腾讯云COS对象存储直传
 * 支持单个和多个文件上传，带进度显示
 */
const COSUpload = ({
  onSuccess,
  onError,
  multiple = false,
  accept = "image/*",
  maxSize = 10, // MB
  buttonText = "上传图片",
  disabled = false,
  showProgress = true,
  className = "",
  value = null, // 当前图片URL（单图上传时）
  onChange = null, // 图片变化回调（单图上传时）
  children,
  // 图片显示配置
  imageWidth = 200,
  imageHeight = 200,
  showPreview = true,
  previewStyle = {}
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]); // 存储每个文件的上传状态
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const uploadingFilesRef = useRef(new Set()); // 记录正在上传的文件，防止重复上传
  const completedFilesRef = useRef(new Set()); // 记录已完成的文件
  const batchResultsRef = useRef([]); // 存储批量上传的结果
  const totalFilesRef = useRef(0); // 记录批量上传的总文件数

  // 监听uploadFiles变化，自动更新uploading状态
  useEffect(() => {
    const hasUploading = uploadFiles.some(file => file.status === 'uploading');
    setUploading(hasUploading);
  }, [uploadFiles]);

  // 验证文件
  const validateFile = (file) => {
    // 检查文件类型
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      throw new Error(`不支持的文件类型: ${file.type}`);
    }

    // 检查文件大小
    const sizeInMB = file.size / 1024 / 1024;
    if (sizeInMB > maxSize) {
      throw new Error(`文件大小不能超过 ${maxSize}MB`);
    }

    return true;
  };

  // 处理单个文件上传
  const handleSingleUpload = async (file) => {
    try {
      validateFile(file);
      setUploading(true);

      const result = await cosDirectUpload(file, {
        onProgress: (progressEvent) => {
          // 单文件上传进度处理
          console.log('上传进度:', progressEvent.percent + '%');
        }
      });

      // 确保返回正确的数据结构 - 适配我们的cosService返回格式
      const uploadResult = {
        url: result.data?.url || result.url,
        fileName: result.data?.fileName || file.name,
        fileSize: result.data?.size || file.size,
        key: result.data?.key,
        thumbnailUrl: result.data?.thumbnailUrl,
        storage: result.data?.storage || 'cos',
        uploadTime: result.data?.uploadTime,
        originalName: result.data?.originalName || file.name
      };

      console.log('📤 上传结果:', result);
      console.log('📤 处理后的结果:', uploadResult);
      console.log('📤 调用onChange回调，URL:', uploadResult.url);
      
      if (onChange) {
        onChange(uploadResult.url);
      }

      console.log('📤 调用onSuccess回调，结果:', uploadResult);
      if (onSuccess) {
        onSuccess(uploadResult);
      }

      toast.success('图片上传成功');
      return true;
    } catch (error) {
      console.error('上传失败:', error);
      toast.error(error.message || '上传失败');
      
      if (onError) {
        onError(error);
      }
      return false;
    } finally {
      setUploading(false);
    }
  };

  // 处理批量上传
  const handleBatchUpload = async (files) => {
    const fileArray = Array.from(files);
    totalFilesRef.current = fileArray.length;
    batchResultsRef.current = [];
    
    // 验证所有文件
    for (const file of fileArray) {
      try {
        validateFile(file);
      } catch (error) {
        toast.error(`文件 ${file.name}: ${error.message}`);
        return;
      }
    }

    // 开始批量上传
    setUploading(true);
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const fileKey = `${file.name}-${file.size}-${Date.now()}-${i}`;
      
      // 防止重复上传
      if (uploadingFilesRef.current.has(fileKey) || completedFilesRef.current.has(fileKey)) {
        continue;
      }

      // 标记为正在上传
      uploadingFilesRef.current.add(fileKey);

      // 添加到上传列表
      const newFile = {
        key: fileKey,
        name: file.name,
        size: file.size,
        status: 'uploading',
        progress: 0,
        uploadInfo: null,
        error: null
      };

      setUploadFiles(prev => [...prev, newFile]);

      try {
        const result = await cosDirectUpload(file, {
          onProgress: (progressEvent) => {
            const percent = Math.round(progressEvent.percent);
            
            // 更新文件进度
            setUploadFiles(prev => prev.map(f => 
              f.key === fileKey 
                ? { 
                    ...f, 
                    progress: percent,
                    uploadInfo: progressEvent.uploadInfo
                  }
                : f
            ));
          }
        });

        // 更新文件状态为成功
        setUploadFiles(prev => prev.map(f => 
          f.key === fileKey 
            ? { 
                ...f, 
                status: 'success', 
                progress: 100,
                uploadInfo: { ...f.uploadInfo, totalTime: result.data?.uploadTime }
              }
            : f
        ));
        
        // 标记为已完成
        completedFilesRef.current.add(fileKey);
        
        // 确保返回正确的数据结构
        const uploadResult = {
          url: result.data?.url || result.url,
          fileName: file.name,
          fileSize: file.size,
          ...result.data
        };

        // 存储批量上传结果
        batchResultsRef.current.push(uploadResult);
        
      } catch (error) {
        // 更新文件状态为失败
        setUploadFiles(prev => prev.map(f => 
          f.key === fileKey 
            ? { ...f, status: 'error', error: error.message }
            : f
        ));

        console.error(`文件 ${file.name} 上传失败:`, error);
      } finally {
        uploadingFilesRef.current.delete(fileKey);
      }
    }

    // 检查是否所有文件都已完成
    if (batchResultsRef.current.length > 0) {
      if (onSuccess) {
        onSuccess(batchResultsRef.current);
      }
      toast.success(`批量上传完成: ${batchResultsRef.current.length} 个文件成功`);
    }

    // 重置批量上传状态
    batchResultsRef.current = [];
    totalFilesRef.current = 0;
    setUploading(false);
  };

  // 处理文件选择
  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (multiple) {
      handleBatchUpload(files);
    } else {
      handleSingleUpload(files[0]);
    }

    // 清空input值，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理拖拽
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (multiple) {
      handleBatchUpload(files);
    } else {
      handleSingleUpload(files[0]);
    }
  };

  // 清除已完成的上传记录
  const clearCompletedUploads = () => {
    setUploadFiles(prev => {
      const remaining = prev.filter(f => f.status === 'uploading');
      // 清理已完成的文件记录
      const removedFiles = prev.filter(f => f.status !== 'uploading');
      removedFiles.forEach(f => {
        completedFilesRef.current.delete(f.key);
      });
      
      // 如果没有剩余的上传中文件，重置上传状态
      if (remaining.length === 0) {
        setUploading(false);
      }
      
      return remaining;
    });
  };

  // 删除当前图片（单图上传时）
  const handleRemoveImage = () => {
    if (onChange) {
      onChange(null);
    }
  };

  // 渲染单个文件的上传进度
  const renderFileProgress = (file) => {
    const getStatusIcon = () => {
      switch (file.status) {
        case 'success':
          return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'error':
          return <AlertCircle className="h-4 w-4 text-red-500" />;
        default:
          return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>;
      }
    };

    const formatFileSize = (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
      <div key={file.key} className="bg-white border border-slate-200 rounded-lg p-3 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
            <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
          </div>
          <div className="ml-2">
            {getStatusIcon()}
          </div>
        </div>
        
        {/* 进度条 */}
        <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              file.status === 'error' ? 'bg-red-500' : 
              file.status === 'success' ? 'bg-green-500' : 'bg-primary-600'
            }`}
            style={{ width: `${file.progress}%` }}
          ></div>
        </div>
        
        {/* 状态信息 */}
        {file.status === 'uploading' && file.uploadInfo && (
          <p className="text-xs text-slate-500">
            {file.uploadInfo.speed && `速度: ${file.uploadInfo.speed}`}
          </p>
        )}
        
        {file.status === 'error' && file.error && (
          <p className="text-xs text-red-600">错误: {file.error}</p>
        )}
        
        {file.status === 'success' && (
          <p className="text-xs text-green-600">上传完成</p>
        )}
      </div>
    );
  };

  // 调试信息
  console.log('🖼️ COSUpload渲染 - value:', value, 'multiple:', multiple);

  return (
    <div className={className}>
      {/* 单图上传 - 显示当前图片 */}
      {!multiple && value && showPreview && (
        <div className="mb-4 relative inline-block">
          <img
            src={value}
            alt="上传的图片"
            style={{
              width: imageWidth,
              height: imageHeight,
              objectFit: 'cover',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              ...previewStyle
            }}
            onLoad={() => console.log('✅ 图片加载成功:', value)}
            onError={() => console.error('❌ 图片加载失败:', value)}
            onClick={() => {
              // 点击图片可以预览大图
              const newWindow = window.open();
              newWindow.document.write(`
                <html>
                  <head><title>图片预览</title></head>
                  <body style="margin:0;padding:20px;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                    <img src="${value}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="图片预览" />
                  </body>
                </html>
              `);
            }}
          />
          <button
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
            type="button"
            title="删除图片"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* 上传区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-slate-300 hover:border-slate-400'
        } ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />

        {children || (
          <div className="space-y-2">
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            ) : (
              <Cloud className="h-8 w-8 text-slate-400 mx-auto" />
            )}
            
            <div>
              <p className="text-sm font-medium text-slate-900">
                {uploading ? (multiple ? '批量上传中...' : '上传中...') : buttonText}
              </p>
              <p className="text-xs text-slate-500">
                支持 {accept} 格式，最大 {maxSize}MB
                {multiple && '，支持多文件上传'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 显示批量上传进度 */}
      {multiple && uploadFiles.length > 0 && showProgress && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-900">
              上传进度 ({uploadFiles.length} 个文件)
            </h4>
            {uploadFiles.some(f => f.status !== 'uploading') && (
              <button
                onClick={clearCompletedUploads}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                清除已完成
              </button>
            )}
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {uploadFiles.map(renderFileProgress)}
          </div>
        </div>
      )}

      {/* 单文件上传进度 */}
      {!multiple && uploading && showProgress && (
        <div className="mt-4">
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full transition-all duration-300 animate-pulse" style={{ width: '50%' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default COSUpload;
