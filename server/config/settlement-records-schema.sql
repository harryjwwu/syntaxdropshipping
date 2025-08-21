-- 结算记录表
CREATE TABLE IF NOT EXISTS settlement_records (
  id VARCHAR(20) PRIMARY KEY COMMENT '结算ID: 日期+4位随机数',
  dxm_client_id INT NOT NULL COMMENT '店小蜜客户ID',
  settlement_date DATE NOT NULL COMMENT '结算日期',
  total_settlement_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '总结算金额',
  order_count INT NOT NULL DEFAULT 0 COMMENT '结算订单数量',
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '结算状态',
  created_by INT DEFAULT NULL COMMENT '创建人ID(管理员)',
  notes TEXT DEFAULT NULL COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_dxm_client_id (dxm_client_id),
  INDEX idx_settlement_date (settlement_date),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='结算记录表';

-- 为所有订单分表添加settlement_record_id字段
ALTER TABLE orders_0 ADD COLUMN settlement_record_id VARCHAR(20) DEFAULT NULL COMMENT '关联的结算记录ID' AFTER settlement_status;
ALTER TABLE orders_1 ADD COLUMN settlement_record_id VARCHAR(20) DEFAULT NULL COMMENT '关联的结算记录ID' AFTER settlement_status;
ALTER TABLE orders_2 ADD COLUMN settlement_record_id VARCHAR(20) DEFAULT NULL COMMENT '关联的结算记录ID' AFTER settlement_status;
ALTER TABLE orders_3 ADD COLUMN settlement_record_id VARCHAR(20) DEFAULT NULL COMMENT '关联的结算记录ID' AFTER settlement_status;
ALTER TABLE orders_4 ADD COLUMN settlement_record_id VARCHAR(20) DEFAULT NULL COMMENT '关联的结算记录ID' AFTER settlement_status;
ALTER TABLE orders_5 ADD COLUMN settlement_record_id VARCHAR(20) DEFAULT NULL COMMENT '关联的结算记录ID' AFTER settlement_status;
ALTER TABLE orders_6 ADD COLUMN settlement_record_id VARCHAR(20) DEFAULT NULL COMMENT '关联的结算记录ID' AFTER settlement_status;
ALTER TABLE orders_7 ADD COLUMN settlement_record_id VARCHAR(20) DEFAULT NULL COMMENT '关联的结算记录ID' AFTER settlement_status;
ALTER TABLE orders_8 ADD COLUMN settlement_record_id VARCHAR(20) DEFAULT NULL COMMENT '关联的结算记录ID' AFTER settlement_status;
ALTER TABLE orders_9 ADD COLUMN settlement_record_id VARCHAR(20) DEFAULT NULL COMMENT '关联的结算记录ID' AFTER settlement_status;

-- 为settlement_record_id字段添加索引
ALTER TABLE orders_0 ADD INDEX idx_settlement_record_id (settlement_record_id);
ALTER TABLE orders_1 ADD INDEX idx_settlement_record_id (settlement_record_id);
ALTER TABLE orders_2 ADD INDEX idx_settlement_record_id (settlement_record_id);
ALTER TABLE orders_3 ADD INDEX idx_settlement_record_id (settlement_record_id);
ALTER TABLE orders_4 ADD INDEX idx_settlement_record_id (settlement_record_id);
ALTER TABLE orders_5 ADD INDEX idx_settlement_record_id (settlement_record_id);
ALTER TABLE orders_6 ADD INDEX idx_settlement_record_id (settlement_record_id);
ALTER TABLE orders_7 ADD INDEX idx_settlement_record_id (settlement_record_id);
ALTER TABLE orders_8 ADD INDEX idx_settlement_record_id (settlement_record_id);
ALTER TABLE orders_9 ADD INDEX idx_settlement_record_id (settlement_record_id);
