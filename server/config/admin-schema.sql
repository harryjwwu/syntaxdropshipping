-- 管理员表结构
USE syntaxdropshipping;

-- 创建管理员表
CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
  permissions JSON DEFAULT NULL, -- 权限配置，例如: {"deposits": true, "users": false, "reports": true}
  last_login_at TIMESTAMP NULL,
  last_login_ip VARCHAR(45) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT DEFAULT NULL, -- 创建此管理员的管理员ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_is_active (is_active)
);

-- 创建管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  action VARCHAR(100) NOT NULL, -- 操作类型：login, logout, approve_deposit, reject_deposit, etc.
  resource_type VARCHAR(50) DEFAULT NULL, -- 资源类型：deposit, user, admin, etc.
  resource_id INT DEFAULT NULL, -- 资源ID
  description TEXT DEFAULT NULL, -- 操作描述
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_admin_id (admin_id),
  INDEX idx_action (action),
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_created_at (created_at)
);

-- 插入默认超级管理员账户（密码需要在应用层加密）
-- 默认密码：admin123456
INSERT INTO admins (username, email, password, name, role) VALUES 
('superadmin', 'admin@syntaxdropshipping.com', '$2a$12$placeholder_hash_will_be_replaced', 'Super Administrator', 'super_admin')
ON DUPLICATE KEY UPDATE username = username;

-- 更新 deposit_records 表的外键引用
-- 将 admin_id 字段的外键约束从 users 表改为 admins 表

-- 首先删除现有的外键约束
ALTER TABLE deposit_records DROP FOREIGN KEY deposit_records_ibfk_2;

-- 添加新的外键约束，引用 admins 表
ALTER TABLE deposit_records 
ADD CONSTRAINT fk_deposit_admin 
FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL;
