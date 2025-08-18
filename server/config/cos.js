require('dotenv').config();
const COS = require('cos-nodejs-sdk-v5');

// COS配置
const cosConfig = {
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
  Region: process.env.COS_REGION || 'ap-beijing',
  Bucket: process.env.COS_BUCKET,
  Domain: process.env.COS_DOMAIN,
  UploadPath: process.env.COS_UPLOAD_PATH || 'syntax-dropshipping',
  Enable: process.env.COS_ENABLE === 'true'
};

// 初始化COS实例
const cos = new COS({
  SecretId: cosConfig.SecretId,
  SecretKey: cosConfig.SecretKey
});

// 生成唯一文件名
const generateFileName = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 1000);
  const ext = originalName.substring(originalName.lastIndexOf('.'));
  const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
  return `${prefix}${timestamp}_${randomNum}_${baseName}${ext}`;
};

// 生成COS文件路径
const generateCOSPath = (fileName, type = 'images') => {
  const datePath = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
  return `${cosConfig.UploadPath}/${type}/${datePath}/${fileName}`;
};

// 生成完整的文件URL
const generateFileURL = (key) => {
  if (cosConfig.Domain) {
    return `${cosConfig.Domain}/${key}`;
  }
  return `https://${cosConfig.Bucket}.cos.${cosConfig.Region}.myqcloud.com/${key}`;
};

// 生成缩略图URL（腾讯云CI图片处理）
const generateThumbnailURL = (originalURL, width = 200, height = 200, quality = 80) => {
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
};

module.exports = {
  cos,
  cosConfig,
  generateFileName,
  generateCOSPath,
  generateFileURL,
  generateThumbnailURL
};
