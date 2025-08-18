-- 价格变更历史表
-- 创建时间: 2025-08-16

-- SPU价格变更历史表
CREATE TABLE IF NOT EXISTS spu_price_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  spu VARCHAR(50) NOT NULL COMMENT '关联的SPU',
  country_code VARCHAR(10) NOT NULL COMMENT '国家代码',
  quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
  
  -- 变更前的价格信息
  old_product_cost DECIMAL(10,2) DEFAULT 0.00 COMMENT '变更前产品成本',
  old_shipping_cost DECIMAL(10,2) DEFAULT 0.00 COMMENT '变更前运费',
  old_packing_cost DECIMAL(10,2) DEFAULT 0.00 COMMENT '变更前包装费',
  old_vat_cost DECIMAL(10,2) DEFAULT 0.00 COMMENT '变更前税费',
  old_total_price DECIMAL(10,2) DEFAULT 0.00 COMMENT '变更前总价',
  
  -- 变更后的价格信息
  new_product_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '变更后产品成本',
  new_shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '变更后运费',
  new_packing_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '变更后包装费',
  new_vat_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '变更后税费',
  new_total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '变更后总价',
  
  -- 变更信息
  change_type ENUM('create', 'update', 'delete') NOT NULL COMMENT '变更类型',
  change_reason VARCHAR(500) COMMENT '变更原因',
  admin_id INT COMMENT '操作管理员ID',
  admin_name VARCHAR(100) COMMENT '操作管理员名称',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',
  
  INDEX idx_spu (spu),
  INDEX idx_country (country_code),
  INDEX idx_quantity (quantity),
  INDEX idx_spu_country_qty (spu, country_code, quantity),
  INDEX idx_change_type (change_type),
  INDEX idx_admin_id (admin_id),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (spu) REFERENCES spus(spu) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SPU价格变更历史表';
