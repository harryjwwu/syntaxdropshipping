-- 添加店小秘客户ID绑定字段到users表
-- Add DianXiaoMi client ID binding field to users table

USE syntaxdropshipping;

-- 重命名bind_shopify_client_id字段为bind_dxm_client_id
ALTER TABLE users 
CHANGE COLUMN bind_shopify_client_id bind_dxm_client_id INT NULL COMMENT '店小秘客户ID绑定';

-- 删除旧索引并添加新索引
ALTER TABLE users 
DROP INDEX idx_bind_shopify_client_id;

ALTER TABLE users 
ADD UNIQUE INDEX idx_bind_dxm_client_id (bind_dxm_client_id);

-- 查看表结构
DESCRIBE users;
