-- 修改结算记录表的日期字段名称
-- 将三个字段改为两个清晰的字段：start_settlement_date, end_settlement_date

USE syntaxdropshipping;

-- 1. 删除之前添加的索引（忽略错误）
ALTER TABLE settlement_records DROP INDEX idx_start_date;
ALTER TABLE settlement_records DROP INDEX idx_end_date;
ALTER TABLE settlement_records DROP INDEX idx_date_range;

-- 2. 重命名字段
ALTER TABLE settlement_records 
CHANGE COLUMN start_date start_settlement_date DATE NOT NULL,
CHANGE COLUMN end_date end_settlement_date DATE NOT NULL;

-- 3. 删除旧的settlement_date字段
ALTER TABLE settlement_records 
DROP COLUMN settlement_date;

-- 4. 添加新的索引
ALTER TABLE settlement_records 
ADD INDEX idx_start_settlement_date (start_settlement_date);

ALTER TABLE settlement_records 
ADD INDEX idx_end_settlement_date (end_settlement_date);

ALTER TABLE settlement_records 
ADD INDEX idx_settlement_date_range (start_settlement_date, end_settlement_date);

-- 验证修改结果
SELECT 'Updated Settlement Records Table Structure:' as info;
DESCRIBE settlement_records;

SELECT 'Sample Data After Field Rename:' as info;
SELECT id, dxm_client_id, start_settlement_date, end_settlement_date, total_settlement_amount, created_at 
FROM settlement_records 
ORDER BY created_at DESC 
LIMIT 5;
