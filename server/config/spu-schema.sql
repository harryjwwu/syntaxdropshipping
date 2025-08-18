-- SPU、SKU、报价管理系统数据库表结构
-- 创建时间: 2025-08-16

-- 1. SPU表 (商品表)
CREATE TABLE IF NOT EXISTS spus (
  spu VARCHAR(50) PRIMARY KEY COMMENT 'SPU编号，唯一标识',
  name VARCHAR(255) NOT NULL COMMENT '商品名称',
  photo VARCHAR(500) COMMENT '商品图片URL',
  logistics_methods VARCHAR(255) COMMENT '物流方式',
  weight DECIMAL(10,3) COMMENT '重量(KG)',
  parent_spu VARCHAR(50) COMMENT '父SPU，关联自身spu字段',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_parent_spu (parent_spu),
  INDEX idx_name (name),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (parent_spu) REFERENCES spus(spu) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SPU商品表';

-- 2. SKU-SPU关系表
CREATE TABLE IF NOT EXISTS sku_spu_relations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(100) NOT NULL COMMENT 'SKU编号',
  spu VARCHAR(50) NOT NULL COMMENT '关联的SPU',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_sku (sku),
  INDEX idx_spu (spu),
  INDEX idx_created_at (created_at),
  UNIQUE KEY uk_sku_spu (sku, spu),
  FOREIGN KEY (spu) REFERENCES spus(spu) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SKU-SPU关系表';

-- 3. SPU价格表 (报价表)
CREATE TABLE IF NOT EXISTS spu_prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  spu VARCHAR(50) NOT NULL COMMENT '关联的SPU',
  country_code VARCHAR(10) NOT NULL COMMENT '国家代码(如SE,FI,DK,NO,US,NL,DE等)',
  product_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '产品成本(美元)',
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '运费(美元)',
  packing_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '包装费(美元)',
  vat_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '税费(美元)',
  quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '总价(美元)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_spu (spu),
  INDEX idx_country (country_code),
  INDEX idx_quantity (quantity),
  INDEX idx_spu_country_qty (spu, country_code, quantity),
  INDEX idx_created_at (created_at),
  UNIQUE KEY uk_spu_country_qty (spu, country_code, quantity),
  FOREIGN KEY (spu) REFERENCES spus(spu) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SPU价格表';

-- 4. 国家代码表 (预设常用国家)
CREATE TABLE IF NOT EXISTS countries (
  code VARCHAR(10) PRIMARY KEY COMMENT '国家代码',
  name VARCHAR(100) NOT NULL COMMENT '国家名称',
  name_cn VARCHAR(100) COMMENT '中文名称',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='国家代码表';

-- 插入常用国家数据
INSERT IGNORE INTO countries (code, name, name_cn, sort_order) VALUES
('SE', 'Sweden', '瑞典', 1),
('FI', 'Finland', '芬兰', 2),
('DK', 'Denmark', '丹麦', 3),
('NO', 'Norway', '挪威', 4),
('US', 'United States', '美国', 5),
('NL', 'Netherlands', '荷兰', 6),
('DE', 'Germany', '德国', 7),
('GB', 'United Kingdom', '英国', 8),
('FR', 'France', '法国', 9),
('IT', 'Italy', '意大利', 10),
('ES', 'Spain', '西班牙', 11),
('CA', 'Canada', '加拿大', 12),
('AU', 'Australia', '澳大利亚', 13),
('JP', 'Japan', '日本', 14),
('KR', 'South Korea', '韩国', 15),
('CN', 'China', '中国', 16);
