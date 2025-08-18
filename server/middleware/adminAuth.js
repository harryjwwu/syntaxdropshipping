const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/database');
const { logAdminAction } = require('../utils/initAdmin');

const authenticateAdmin = async (req, res, next) => {
  try {
    console.log('🔐 [AUTH] 认证中间件开始 - 路径:', req.path);
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('❌ [AUTH] 没有token');
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }

    console.log('🔐 [AUTH] Token存在，开始验证...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 [AUTH] Token解码成功:', { adminId: decoded.adminId, email: decoded.email, role: decoded.role });
    
    // 验证管理员是否存在且活跃
    const db = await getConnection();
    console.log('🔐 [AUTH] 查询管理员，adminId:', decoded.adminId);
    const [admins] = await db.execute(
      `SELECT id, username, email, name, role, permissions, is_active 
       FROM admins WHERE id = ?`, 
      [decoded.adminId]
    );

    console.log('🔐 [AUTH] 管理员查询结果:', admins);
    console.log('🔐 [AUTH] 查询结果数量:', admins.length);

    if (admins.length === 0 || !admins[0].is_active) {
      console.log('❌ [AUTH] 管理员不存在或未激活');
      return res.status(403).json({ 
        success: false,
        message: 'Access denied, admin not found or inactive' 
      });
    }

    // 将管理员信息添加到请求对象
    req.admin = admins[0];
    req.adminId = admins[0].id;

    console.log('✅ [AUTH] 认证成功，继续处理请求');
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Token is not valid' 
    });
  }
};

/**
 * 检查管理员权限的中间件
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      const admin = req.admin;
      
      // 超级管理员拥有所有权限
      if (admin.role === 'super_admin') {
        return next();
      }

      // 检查具体权限
      const permissions = typeof admin.permissions === 'string' 
        ? JSON.parse(admin.permissions) 
        : admin.permissions;

      if (!permissions || !permissions[permission]) {
        return res.status(403).json({
          success: false,
          message: `Access denied, ${permission} permission required`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * 记录操作日志的中间件
 */
const logAction = (action, resourceType = null) => {
  return (req, res, next) => {
    // 在响应完成后记录日志
    const originalSend = res.send;
    res.send = function(data) {
      // 只在成功操作时记录日志
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resourceId = req.params.id || null;
        const description = `${action} ${resourceType || ''} ${resourceId || ''}`.trim();
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        logAdminAction(
          req.adminId,
          action,
          resourceType,
          resourceId,
          description,
          ipAddress,
          userAgent
        );
      }
      
      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = { 
  authenticateAdmin,
  requirePermission,
  logAction
};