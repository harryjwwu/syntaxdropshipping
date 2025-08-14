-- 更新 deposit_records 表的状态枚举
-- 将状态机简化为：pending -> approved/rejected

USE syntaxdropshipping;

-- 修改 status 字段的枚举值
ALTER TABLE deposit_records 
MODIFY COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';

-- 更新现有数据：将 'completed' 状态改为 'approved'，'processing' 状态改为 'pending'
UPDATE deposit_records 
SET status = 'approved' 
WHERE status = 'completed';

UPDATE deposit_records 
SET status = 'pending' 
WHERE status = 'processing';

