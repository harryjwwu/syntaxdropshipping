-- 修改结算记录表，添加日期范围支持
-- 将单个settlement_date字段拆分为start_date和end_date

USE syntaxdropshipping;

-- 1. 添加新的日期范围字段
ALTER TABLE settlement_records 
ADD COLUMN start_date DATE NULL AFTER settlement_date,
ADD COLUMN end_date DATE NULL AFTER start_date;

-- 2. 将现有的settlement_date数据迁移到新字段
UPDATE settlement_records 
SET start_date = settlement_date, 
    end_date = settlement_date 
WHERE start_date IS NULL AND end_date IS NULL;

-- 3. 设置新字段为非空（在数据迁移后）
ALTER TABLE settlement_records 
MODIFY COLUMN start_date DATE NOT NULL,
MODIFY COLUMN end_date DATE NOT NULL;

-- 4. 添加索引以提高查询性能
ALTER TABLE settlement_records 
ADD INDEX idx_start_date (start_date),
ADD INDEX idx_end_date (end_date),
ADD INDEX idx_date_range (start_date, end_date);

-- 5. 可选：删除旧的settlement_date字段（注释掉，以防需要回滚）
-- ALTER TABLE settlement_records DROP COLUMN settlement_date;

-- 验证修改结果
SELECT 'Settlement Records Table Structure:' as info;
DESCRIBE settlement_records;

SELECT 'Sample Data After Migration:' as info;
SELECT id, dxm_client_id, settlement_date, start_date, end_date, created_at 
FROM settlement_records 
ORDER BY created_at DESC 
LIMIT 5;
