const express = require('express');
const router = express.Router();
const { 
  getCOSUploadSignature,
  uploadImageToCOS,
  deleteCOSFile,
  getCOSConfig
} = require('../controllers/cosController');
const { authenticateAdmin } = require('../middleware/adminAuth');

// 所有COS路由都需要管理员认证
router.use(authenticateAdmin);

// GET /api/cos/config - 获取COS配置信息
router.get('/config', getCOSConfig);

// POST /api/cos/signature - 获取COS上传签名（前端直传用）
router.post('/signature', getCOSUploadSignature);

// POST /api/cos/upload - 服务端上传到COS（兼容现有接口）
router.post('/upload', uploadImageToCOS);

// DELETE /api/cos/delete - 删除COS文件
router.delete('/delete', deleteCOSFile);

module.exports = router;
