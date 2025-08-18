-- 修改spu_prices表中的dxm_client_id字段类型为INT
-- 执行时间: 2025-01-XX

-- 重要提示：在执行此脚本前，请确保：
-- 1. dxm_client_id字段中的所有值都是有效的数字
-- 2. 已经备份了数据库

-- 1. 首先检查是否有非数字值（可选，用于验证）
-- SELECT spu, dxm_client_id FROM spu_prices WHERE dxm_client_id NOT REGEXP '^[0-9]+$';

-- 2. 删除包含dxm_client_id的索引和约束
ALTER TABLE spu_prices DROP INDEX uk_spu_client_country_qty;
ALTER TABLE spu_prices DROP INDEX idx_dxm_client_id;
ALTER TABLE spu_prices DROP INDEX idx_spu_client;
ALTER TABLE spu_prices DROP INDEX idx_client_country;

-- 3. 修改字段类型为INT
ALTER TABLE spu_prices MODIFY COLUMN dxm_client_id INT NOT NULL COMMENT '店小秘客户ID';

-- 4. 重新创建索引和约束
ALTER TABLE spu_prices ADD UNIQUE KEY uk_spu_client_country_qty (spu, dxm_client_id, country_code, quantity);
ALTER TABLE spu_prices ADD INDEX idx_dxm_client_id (dxm_client_id);
ALTER TABLE spu_prices ADD INDEX idx_spu_client (spu, dxm_client_id);
ALTER TABLE spu_prices ADD INDEX idx_client_country (dxm_client_id, country_code);

-- 5. 验证修改结果
-- DESCRIBE spu_prices;
