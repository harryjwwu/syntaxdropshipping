-- 优化店小秘客户ID字段名称
-- Optimize DianXiaoMi client ID field name

USE syntaxdropshipping;

-- 重命名bind_dxm_client_id字段为dxm_client_id
ALTER TABLE users 
CHANGE COLUMN bind_dxm_client_id dxm_client_id INT NULL COMMENT '店小秘客户ID';

-- 删除旧索引并添加新索引
ALTER TABLE users 
DROP INDEX idx_bind_dxm_client_id;

ALTER TABLE users 
ADD UNIQUE INDEX idx_dxm_client_id (dxm_client_id);

-- 查看表结构
DESCRIBE users;
