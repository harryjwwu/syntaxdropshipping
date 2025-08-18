const multer = require('multer');
const { cos, cosConfig, generateFileName, generateCOSPath, generateFileURL, generateThumbnailURL } = require('../config/cos');

/**
 * 获取COS上传签名（前端直传用）
 */
async function getCOSUploadSignature(req, res) {
  try {
    if (!cosConfig.Enable) {
      return res.status(400).json({
        success: false,
        error: 'COS功能未启用，请联系管理员配置'
      });
    }

    const { fileName, fileType = 'images' } = req.body;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        error: '文件名不能为空'
      });
    }

    // 生成唯一文件名和路径
    const uniqueFileName = generateFileName(fileName);
    const key = generateCOSPath(uniqueFileName, fileType);
    
    // 生成预签名URL，用于PUT上传
    const signedUrl = cos.getObjectUrl({
      Bucket: cosConfig.Bucket,
      Region: cosConfig.Region,
      Key: key,
      Method: 'PUT',
      Expires: 7200, // 增加到2小时，适应大文件上传
      Headers: {
        // 移除Headers，避免签名不匹配
      },
      Query: {},
      Sign: true
    });

    // 生成最终的文件URL
    const fileURL = generateFileURL(key);
    const thumbnailURL = generateThumbnailURL(fileURL);

    console.log('生成COS预签名URL:', {
      key,
      uploadUrl: signedUrl,
      fileUrl: fileURL,
      bucket: cosConfig.Bucket,
      region: cosConfig.Region,
      expires: '7200s'
    });

    res.json({
      success: true,
      data: {
        uploadUrl: signedUrl,
        key: key,
        fileName: uniqueFileName,
        fileUrl: fileURL,
        thumbnailUrl: thumbnailURL,
        bucket: cosConfig.Bucket,
        region: cosConfig.Region
      }
    });

  } catch (error) {
    console.error('获取COS上传签名失败:', error);
    res.status(500).json({
      success: false,
      error: '获取上传签名失败: ' + error.message
    });
  }
}

/**
 * 服务端上传文件到COS
 */
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

const uploadToCOS = upload.single('image');

async function uploadImageToCOS(req, res) {
  uploadToCOS(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: '文件大小不能超过10MB'
        });
      }
      return res.status(400).json({
        success: false,
        error: '文件上传失败: ' + err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请选择要上传的图片'
      });
    }

    try {
      // 检查COS是否启用
      if (!cosConfig.Enable) {
        return res.status(400).json({
          success: false,
          error: 'COS对象存储未启用，请联系管理员配置'
        });
      }

      // 生成文件名和路径
      const uniqueFileName = generateFileName(req.file.originalname);
      const key = generateCOSPath(uniqueFileName, 'images');

      // 上传到COS
      const result = await cos.putObject({
        Bucket: cosConfig.Bucket,
        Region: cosConfig.Region,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      });

      const fileURL = generateFileURL(key);
      const thumbnailURL = generateThumbnailURL(fileURL);

      res.json({
        success: true,
        message: '图片上传成功',
        data: {
          filename: uniqueFileName,
          originalName: req.file.originalname,
          size: req.file.size,
          url: fileURL,
          thumbnailUrl: thumbnailURL,
          key: key,
          storage: 'cos'
        }
      });

    } catch (error) {
      console.error('COS上传失败:', error);
      res.status(500).json({
        success: false,
        error: 'COS上传失败: ' + error.message
      });
    }
  });
}

/**
 * 删除COS文件
 */
async function deleteCOSFile(req, res) {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: '文件key不能为空'
      });
    }

    if (!cosConfig.Enable) {
      return res.status(400).json({
        success: false,
        error: 'COS功能未启用'
      });
    }

    await cos.deleteObject({
      Bucket: cosConfig.Bucket,
      Region: cosConfig.Region,
      Key: key
    });

    res.json({
      success: true,
      message: '文件删除成功'
    });

  } catch (error) {
    console.error('删除COS文件失败:', error);
    res.status(500).json({
      success: false,
      error: '文件删除失败'
    });
  }
}

/**
 * 获取COS配置信息（前端用）
 */
function getCOSConfig(req, res) {
  res.json({
    success: true,
    data: {
      enabled: cosConfig.Enable,
      region: cosConfig.Region,
      bucket: cosConfig.Bucket,
      domain: cosConfig.Domain,
      uploadPath: cosConfig.UploadPath
    }
  });
}

module.exports = {
  getCOSUploadSignature,
  uploadImageToCOS,
  deleteCOSFile,
  getCOSConfig
};
