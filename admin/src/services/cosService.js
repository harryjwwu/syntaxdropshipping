import { adminAPI } from '../utils/api';

// COS配置缓存
let cosConfig = null;

/**
 * 获取COS配置
 */
async function getCOSConfig() {
  if (cosConfig) {
    console.log('🔄 使用缓存的COS配置:', cosConfig);
    return cosConfig;
  }
  
  try {
    console.log('🔍 开始获取COS配置...');
    const response = await adminAPI.getCOSConfig();
    console.log('📋 COS配置响应:', response);
    
    if (response.success) {
      cosConfig = response.data;
      console.log('✅ COS配置获取成功:', cosConfig);
      return cosConfig;
    } else {
      console.error('❌ COS配置响应失败:', response);
    }
  } catch (error) {
    console.error('❌ 获取COS配置失败:', error);
    console.error('错误详情:', error.response || error.message);
  }
  
  return null;
}

/**
 * 获取上传签名
 */
async function getUploadSignature(fileName, fileType = 'images') {
  try {
    const response = await adminAPI.getCOSUploadSignature(fileName, fileType);
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error || '获取上传签名失败');
    }
  } catch (error) {
    throw error;
  }
}

/**
 * 直传文件到COS（使用预签名URL）
 */
async function uploadToCOS(file, fileType = 'images', onProgress = null) {
  try {
    // 根据文件大小动态计算超时时间（每MB给30秒，最少2分钟，最多20分钟）
    const timeoutMs = Math.max(120000, Math.min(1200000, file.size / 1024 / 1024 * 30000));
    
    // 获取上传签名
    const signatureData = await getUploadSignature(file.name, fileType);
    
    const xhr = new XMLHttpRequest();
    let isResolved = false; // 防止重复resolve
    let uploadStartTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const handleSuccess = () => {
        if (isResolved) return;
        isResolved = true;
        
        const totalTime = Math.round((Date.now() - uploadStartTime) / 1000);
        
        const result = {
          success: true,
          data: {
            url: signatureData.fileUrl,
            thumbnailUrl: signatureData.thumbnailUrl,
            key: signatureData.key,
            fileName: signatureData.fileName,
            originalName: file.name,
            size: file.size,
            storage: 'cos',
            uploadTime: totalTime
          }
        };
        resolve(result);
      };
      
      const handleError = (errorMsg) => {
        if (isResolved) return;
        isResolved = true;
        reject(new Error(errorMsg));
      };
      
      // 进度处理
      xhr.upload.onprogress = function(event) {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          const currentTime = Date.now();
          const elapsedSeconds = Math.round((currentTime - uploadStartTime) / 1000);
          const uploadedMB = (event.loaded / (1024 * 1024)).toFixed(2);
          const totalMB = (event.total / (1024 * 1024)).toFixed(2);
          
          try {
            onProgress({
              loaded: event.loaded,
              total: event.total,
              percent: percentComplete,
              uploadInfo: {
                uploadedMB,
                totalMB,
                elapsedSeconds,
                speed: elapsedSeconds > 0 ? (event.loaded / 1024 / 1024 / elapsedSeconds).toFixed(2) + ' MB/s' : '0 MB/s'
              }
            });
          } catch (progressError) {
            console.error('进度回调执行失败:', progressError);
          }
        }
      };
      
      // 使用onload事件作为主要成功检测
      xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 204) {
          handleSuccess();
        } else {
          const errorMsg = `COS上传失败: HTTP ${xhr.status} ${xhr.statusText}`;
          handleError(errorMsg);
        }
      };
      
      // 使用onreadystatechange作为备用检测
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && !isResolved) {
          if (xhr.status === 200 || xhr.status === 204) {
            handleSuccess();
          } else if (xhr.status === 0) {
            handleError('上传失败，状态码: 0。可能是CORS跨域问题或网络连接失败。建议检查网络连接或稍后重试。');
          } else {
            handleError(`上传失败，状态码: ${xhr.status}，错误: ${xhr.statusText}`);
          }
        }
      };
      
      xhr.onerror = function(event) {
        handleError('网络错误: 可能是CORS跨域问题，请检查COS存储桶的跨域配置，或检查网络连接后重试');
      };
      
      xhr.ontimeout = function() {
        const elapsedMinutes = Math.round((Date.now() - uploadStartTime) / 60000);
        handleError(`上传超时 (${elapsedMinutes}分钟)。建议: 压缩文件后重试，或检查网络速度`);
      };
      
      xhr.onabort = function() {
        handleError('上传中止: 上传操作被用户或系统中止');
      };
      
      // 设置动态超时时间
      xhr.timeout = timeoutMs;
      
      // 配置PUT请求
      xhr.open('PUT', signatureData.uploadUrl, true);
      
      // 设置请求头 - 确保与签名算法匹配
      xhr.setRequestHeader('Content-Type', file.type);
      
      // 发送文件到COS
      xhr.send(file);
    });
    
  } catch (error) {
    console.error('COS直传失败:', error);
    throw error;
  }
}

/**
 * COS直传上传 - 纯COS对象存储
 */
async function cosDirectUpload(file, options = {}) {
  try {
    console.log('开始COS直传:', file.name);
    
    const config = await getCOSConfig();
    console.log('COS配置:', config);
    
    // 检查COS是否启用
    if (!config || !config.enabled) {
      throw new Error('COS对象存储未启用，请联系管理员配置COS存储服务');
    }
    
    // 直接使用COS上传
    return await uploadToCOS(file, 'images', options.onProgress);
    
  } catch (error) {
    console.error('COS上传失败:', error);
    // 提供更友好的错误信息
    let friendlyMessage = error.message;
    if (error.message.includes('状态码: 0')) {
      friendlyMessage = '网络连接失败，请检查网络后重试';
    } else if (error.message.includes('超时')) {
      friendlyMessage = '上传超时，建议压缩文件或检查网络速度后重试';
    } else if (error.message.includes('CORS')) {
      friendlyMessage = '跨域访问问题，请联系管理员检查COS配置';
    }
    
    throw new Error(friendlyMessage);
  }
}

/**
 * 删除COS文件
 */
async function deleteCOSFile(key) {
  try {
    const response = await adminAPI.deleteCOSFile(key);
    return response;
  } catch (error) {
    console.error('删除COS文件失败:', error);
    throw error;
  }
}

/**
 * 生成缩略图URL
 */
function generateThumbnailURL(originalURL, width = 200, height = 200, quality = 80) {
  if (!originalURL || !originalURL.includes('.myqcloud.com')) {
    return originalURL; // 如果不是COS链接，直接返回原图
  }
  
  // 腾讯云CI图片处理参数
  const params = [
    `imageMogr2/thumbnail/${width}x${height}`,
    `quality/${quality}`,
    'format/webp' // 优化格式
  ].join('/');
  
  return `${originalURL}?${params}`;
}

/**
 * 判断是否为COS URL
 */
function isCOSURL(url) {
  return url && (url.includes('.myqcloud.com') || url.includes('.cos.'));
}

/**
 * 获取显示用的图片URL（缩略图或原图）
 */
function getDisplayURL(originalURL, useThumbnail = true, width = 200, height = 200) {
  if (!originalURL) return '';
  
  // 如果是COS链接且需要缩略图
  if (useThumbnail && isCOSURL(originalURL)) {
    return generateThumbnailURL(originalURL, width, height);
  }
  
  return originalURL;
}

/**
 * 列表页缩略图 - 小尺寸，高压缩，适合列表展示
 */
function generateListThumbnailURL(originalURL, size = 80, quality = 70) {
  if (!originalURL || !isCOSURL(originalURL)) {
    return originalURL;
  }
  
  const params = [
    `imageMogr2/thumbnail/${size}x${size}`,
    `quality/${quality}`,
    'format/webp'
  ].join('/');
  
  return `${originalURL}?${params}`;
}

export {
  getCOSConfig,
  getUploadSignature,
  uploadToCOS,
  cosDirectUpload,
  deleteCOSFile,
  generateThumbnailURL,
  isCOSURL,
  getDisplayURL,
  generateListThumbnailURL
};
