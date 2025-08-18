-- 用户折扣规则表
-- 创建时间: 2025-01-XX

-- 用户折扣规则表
CREATE TABLE IF NOT EXISTS user_discount_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dxm_client_id INT NOT NULL COMMENT '店小秘客户ID',
  min_quantity INT NOT NULL COMMENT '最小数量',
  max_quantity INT NOT NULL COMMENT '最大数量', 
  discount_rate DECIMAL(3,2) NOT NULL COMMENT '折扣率(0.85表示8.5折)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_dxm_client_id (dxm_client_id),
  INDEX idx_quantity_range (min_quantity, max_quantity),
  UNIQUE KEY uk_client_quantity_range (dxm_client_id, min_quantity, max_quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户折扣规则表';

-- 插入示例数据（可选）
-- INSERT INTO user_discount_rules (dxm_client_id, min_quantity, max_quantity, discount_rate) VALUES
-- (444, 1, 3, 0.90),
-- (444, 4, 8, 0.85),
-- (555, 1, 5, 0.88),
-- (555, 6, 10, 0.82);
