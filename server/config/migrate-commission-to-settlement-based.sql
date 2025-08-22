-- 重构佣金记录表：从基于订单改为基于结算
-- 将order_id改为settlement_id，order_amount改为settlement_amount

USE syntaxdropshipping;

-- 1. 备份现有数据（如果有的话）
CREATE TABLE IF NOT EXISTS commission_records_backup AS 
SELECT * FROM commission_records;

-- 2. 清空现有数据（因为结构变化，旧数据不再适用）
TRUNCATE TABLE commission_records;

-- 3. 删除现有的外键约束
ALTER TABLE commission_records DROP FOREIGN KEY IF EXISTS commission_records_ibfk_1;
ALTER TABLE commission_records DROP FOREIGN KEY IF EXISTS fk_commission_order;

-- 4. 修改字段结构
ALTER TABLE commission_records 
CHANGE COLUMN order_id settlement_id VARCHAR(20) NOT NULL COMMENT '结算记录ID',
CHANGE COLUMN order_amount settlement_amount DECIMAL(12,2) NOT NULL COMMENT '结算金额';

-- 5. 添加新的索引
ALTER TABLE commission_records 
ADD INDEX idx_settlement_id (settlement_id),
ADD INDEX idx_referrer_settlement (referrer_id, settlement_id),
ADD INDEX idx_status_created (status, created_at);

-- 6. 添加外键约束（确保数据完整性）
ALTER TABLE commission_records 
ADD CONSTRAINT fk_commission_settlement 
FOREIGN KEY (settlement_id) REFERENCES settlement_records(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. 更新字段注释
ALTER TABLE commission_records 
MODIFY COLUMN referrer_id INT NOT NULL COMMENT '邀请人用户ID',
MODIFY COLUMN referee_id INT NOT NULL COMMENT '被邀请人用户ID',
MODIFY COLUMN commission_amount DECIMAL(12,2) NOT NULL COMMENT '佣金金额',
MODIFY COLUMN commission_rate DECIMAL(5,4) DEFAULT 0.0200 COMMENT '佣金比例',
MODIFY COLUMN status ENUM('pending','approved','frozen','available','paid','cancelled') DEFAULT 'pending' COMMENT '佣金状态';

-- 8. 添加approved状态到枚举值
ALTER TABLE commission_records 
MODIFY COLUMN status ENUM('pending','approved','frozen','available','paid','cancelled') DEFAULT 'pending';

-- 验证修改结果
SELECT 'Updated Commission Records Table Structure:' as info;
DESCRIBE commission_records;

SELECT 'Table Constraints:' as info;
SELECT 
    CONSTRAINT_NAME, 
    CONSTRAINT_TYPE, 
    TABLE_NAME, 
    COLUMN_NAME, 
    REFERENCED_TABLE_NAME, 
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'syntaxdropshipping' 
AND TABLE_NAME = 'commission_records' 
AND REFERENCED_TABLE_NAME IS NOT NULL;
