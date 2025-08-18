-- 为spu_prices表添加客户ID字段
-- 执行时间: 2025-01-XX

-- 1. 添加dxm_client_id字段
ALTER TABLE spu_prices ADD COLUMN dxm_client_id VARCHAR(50) NOT NULL COMMENT '店小秘客户ID' AFTER spu;

-- 2. 删除原有的唯一约束
ALTER TABLE spu_prices DROP INDEX uk_spu_country_qty;

-- 3. 添加包含客户ID的新唯一约束
ALTER TABLE spu_prices ADD UNIQUE KEY uk_spu_client_country_qty (spu, dxm_client_id, country_code, quantity);

-- 4. 为dxm_client_id添加单独索引
ALTER TABLE spu_prices ADD INDEX idx_dxm_client_id (dxm_client_id);

-- 5. 添加复合索引以优化查询性能
ALTER TABLE spu_prices ADD INDEX idx_spu_client (spu, dxm_client_id);
ALTER TABLE spu_prices ADD INDEX idx_client_country (dxm_client_id, country_code);
