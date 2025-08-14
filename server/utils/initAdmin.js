const bcrypt = require('bcryptjs');
const { getConnection } = require('../config/database');

/**
 * 初始化管理员账户
 */
async function initializeAdmin() {
  try {
    const connection = await getConnection();
    
    // 检查是否已存在管理员
    const [existingAdmins] = await connection.execute(
      'SELECT COUNT(*) as count FROM admins WHERE role = "super_admin"'
    );

    if (existingAdmins[0].count > 0) {
      console.log('✅ Super admin already exists, skipping initialization');
      return;
    }

    // 创建默认超级管理员
    const defaultPassword = 'admin123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    await connection.execute(
      `INSERT INTO admins (username, email, password, name, role, permissions) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'superadmin',
        'admin@syntaxdropshipping.com',
        hashedPassword,
        'Super Administrator',
        'super_admin',
        JSON.stringify({
          deposits: true,
          users: true,
          admins: true,
          reports: true,
          system: true
        })
      ]
    );

    console.log('✅ Super admin created successfully');
    console.log('📧 Email: admin@syntaxdropshipping.com');
    console.log('🔑 Password: admin123456');
    console.log('⚠️  Please change the default password after first login!');

  } catch (error) {
    console.error('❌ Failed to initialize admin:', error);
    throw error;
  }
}

/**
 * 创建新管理员
 */
async function createAdmin(adminData) {
  try {
    const connection = await getConnection();
    const { username, email, password, name, role = 'admin', permissions = {}, createdBy } = adminData;

    // 检查用户名和邮箱是否已存在
    const [existing] = await connection.execute(
      'SELECT id FROM admins WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      throw new Error('Username or email already exists');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 插入新管理员
    const [result] = await connection.execute(
      `INSERT INTO admins (username, email, password, name, role, permissions, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, name, role, JSON.stringify(permissions), createdBy]
    );

    console.log(`✅ Admin created successfully: ${username} (${email})`);
    return result.insertId;

  } catch (error) {
    console.error('❌ Failed to create admin:', error);
    throw error;
  }
}

/**
 * 记录管理员操作日志
 */
async function logAdminAction(adminId, action, resourceType = null, resourceId = null, description = null, ipAddress = null, userAgent = null) {
  try {
    const connection = await getConnection();
    
    await connection.execute(
      `INSERT INTO admin_logs (admin_id, action, resource_type, resource_id, description, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [adminId, action, resourceType, resourceId, description, ipAddress, userAgent]
    );

  } catch (error) {
    console.error('❌ Failed to log admin action:', error);
    // 不抛出错误，避免影响主要操作
  }
}

/**
 * 获取管理员信息（不包含密码）
 */
async function getAdminById(adminId) {
  try {
    const connection = await getConnection();
    
    const [admins] = await connection.execute(
      `SELECT id, username, email, name, phone, avatar, role, permissions, 
              last_login_at, last_login_ip, is_active, created_at, updated_at
       FROM admins WHERE id = ? AND is_active = TRUE`,
      [adminId]
    );

    return admins[0] || null;
  } catch (error) {
    console.error('❌ Failed to get admin:', error);
    throw error;
  }
}

/**
 * 验证管理员登录
 */
async function validateAdminLogin(email, password) {
  try {
    const connection = await getConnection();
    
    const [admins] = await connection.execute(
      'SELECT id, username, email, password, name, role, permissions, is_active FROM admins WHERE email = ?',
      [email]
    );

    if (admins.length === 0) {
      return { success: false, message: 'Admin not found' };
    }

    const admin = admins[0];

    if (!admin.is_active) {
      return { success: false, message: 'Admin account is disabled' };
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid password' };
    }

    // 更新最后登录时间
    await connection.execute(
      'UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [admin.id]
    );

    // 返回管理员信息（不包含密码）
    const { password: _, ...adminInfo } = admin;
    return { success: true, admin: adminInfo };

  } catch (error) {
    console.error('❌ Admin login validation error:', error);
    return { success: false, message: 'Login validation failed' };
  }
}

module.exports = {
  initializeAdmin,
  createAdmin,
  logAdminAction,
  getAdminById,
  validateAdminLogin
};
