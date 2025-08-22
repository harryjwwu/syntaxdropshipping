-- 移除commission_accounts表中复杂的推荐统计字段
-- 简化逻辑，直接从users表统计推荐人数

-- 移除total_referrals字段
ALTER TABLE commission_accounts DROP COLUMN total_referrals;

-- 移除active_referrals字段  
ALTER TABLE commission_accounts DROP COLUMN active_referrals;

-- 显示修改后的表结构
DESCRIBE commission_accounts;
