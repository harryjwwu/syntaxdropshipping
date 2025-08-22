-- 重新创建基于结算的佣金记录表

USE syntaxdropshipping;

-- 1. 备份并删除旧表
DROP TABLE IF EXISTS commission_records_old;
RENAME TABLE commission_records TO commission_records_old;

-- 2. 创建新的佣金记录表（基于结算）
CREATE TABLE commission_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  settlement_id VARCHAR(20) NOT NULL COMMENT '结算记录ID',
  referrer_id INT NOT NULL COMMENT '邀请人用户ID',
  referee_id INT NOT NULL COMMENT '被邀请人用户ID', 
  dxm_client_id INT NOT NULL COMMENT '店小秘客户ID',
  settlement_amount DECIMAL(12,2) NOT NULL COMMENT '结算金额',
  commission_amount DECIMAL(12,2) NOT NULL COMMENT '佣金金额',
  commission_rate DECIMAL(5,4) DEFAULT 0.0200 COMMENT '佣金比例',
  status ENUM('pending','approved','frozen','available','paid','cancelled') DEFAULT 'pending' COMMENT '佣金状态',
  admin_id INT NULL COMMENT '审核管理员ID',
  approved_at TIMESTAMP NULL COMMENT '审核时间',
  paid_at TIMESTAMP NULL COMMENT '支付时间',
  freeze_until TIMESTAMP NULL COMMENT '冻结到期时间',
  notes TEXT NULL COMMENT '备注信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_settlement_id (settlement_id),
  INDEX idx_referrer_id (referrer_id),
  INDEX idx_referee_id (referee_id),
  INDEX idx_dxm_client_id (dxm_client_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_referrer_settlement (referrer_id, settlement_id),
  INDEX idx_status_created (status, created_at),
  
  -- 外键约束
  FOREIGN KEY fk_commission_settlement (settlement_id) REFERENCES settlement_records(id) ON DELETE CASCADE,
  FOREIGN KEY fk_commission_referrer (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY fk_commission_referee (referee_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='佣金记录表（基于结算）';

-- 验证新表结构
SELECT 'New Commission Records Table Structure:' as info;
DESCRIBE commission_records;

