-- 订单表分表结构设计
-- 根据 dxm_client_id 进行 hash 分表
-- 测试环境分 10 个表：orders_0, orders_1, ..., orders_9

-- 创建订单分表的通用结构
-- 注意：这个脚本会创建所有分表

-- 分表配置表
CREATE TABLE IF NOT EXISTS `order_sharding_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `table_count` int NOT NULL DEFAULT 10 COMMENT '分表数量',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单分表配置';

-- 插入默认配置
INSERT IGNORE INTO `order_sharding_config` (`id`, `table_count`) VALUES (1, 10);

-- 创建订单分表的存储过程
DELIMITER $$

DROP PROCEDURE IF EXISTS CreateOrderTables$$

CREATE PROCEDURE CreateOrderTables()
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE table_count INT DEFAULT 10;
    DECLARE table_name VARCHAR(50);
    
    -- 获取分表数量
    SELECT `table_count` INTO table_count FROM `order_sharding_config` WHERE `id` = 1;
    
    WHILE i < table_count DO
        SET table_name = CONCAT('orders_', i);
        
        -- 动态创建分表
        SET @sql = CONCAT('
        CREATE TABLE IF NOT EXISTS `', table_name, '` (
          `id` int NOT NULL AUTO_INCREMENT COMMENT ''主键ID'',
          `dxm_order_id` varchar(50) NOT NULL COMMENT ''DXM订单号，如：7268217-3290'',
          `dxm_client_id` int NOT NULL COMMENT ''DXM客户ID，从订单号拆分'',
          `order_id` int NOT NULL COMMENT ''真实订单ID，从订单号拆分'',
          `country_code` varchar(5) DEFAULT NULL COMMENT ''国家二字码'',
          `product_count` int DEFAULT 1 COMMENT ''商品数量'',
          `buyer_name` varchar(100) DEFAULT NULL COMMENT ''买家姓名'',
          `product_name` text COMMENT ''产品名称'',
          `payment_time` datetime DEFAULT NULL COMMENT ''付款时间'',
          `waybill_number` varchar(50) DEFAULT NULL COMMENT ''运单号'',
          `product_sku` varchar(50) DEFAULT NULL COMMENT ''商品SKU'',
          `product_spu` varchar(50) DEFAULT NULL COMMENT ''商品SPU'',
          `product_parent_spu` varchar(50) DEFAULT NULL COMMENT ''替换SPU'',
          `unit_price` decimal(10,2) DEFAULT 0.00 COMMENT ''单价（美元）'',
          `multi_total_price` decimal(10,2) DEFAULT 0.00 COMMENT ''总价（美元）'',
          `discount` decimal(5,2) DEFAULT 0.00 COMMENT ''折扣'',
          `settlement_amount` decimal(10,2) DEFAULT 0.00 COMMENT ''结算金额'',
          `remark` json DEFAULT NULL COMMENT ''备注信息：{customer_remark, picking_remark, order_remark}'',
          `order_status` varchar(50) DEFAULT NULL COMMENT ''订单状态'',
          `settlement_status` enum(''waiting'',''cancel'',''settled'') DEFAULT ''waiting'' COMMENT ''结算状态'',
          `settle_remark` text COMMENT ''结算算法说明'',
          `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT ''创建时间'',
          `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT ''更新时间'',
          PRIMARY KEY (`id`),
          UNIQUE KEY `uk_dxm_order_product` (`dxm_order_id`, `product_sku`, `product_name`(100)) COMMENT ''订单+商品唯一约束'',
          KEY `idx_dxm_client_id` (`dxm_client_id`) COMMENT ''DXM客户ID索引'',
          KEY `idx_order_id` (`order_id`) COMMENT ''订单ID索引'',
          KEY `idx_payment_time` (`payment_time`) COMMENT ''付款时间索引'',
          KEY `idx_order_status` (`order_status`) COMMENT ''订单状态索引'',
          KEY `idx_settlement_status` (`settlement_status`) COMMENT ''结算状态索引'',
          KEY `idx_waybill_number` (`waybill_number`) COMMENT ''运单号索引'',
          KEY `idx_created_at` (`created_at`) COMMENT ''创建时间索引''
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT=''订单表_', i, '''');
        
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        
        SET i = i + 1;
    END WHILE;
    
END$$

DELIMITER ;

-- 执行存储过程创建所有分表
CALL CreateOrderTables();

-- 删除存储过程
DROP PROCEDURE CreateOrderTables;

-- 创建订单统计视图（可选，用于跨表查询）
-- 注意：这个视图在数据量大时性能较差，建议只用于小范围查询
CREATE OR REPLACE VIEW `orders_all` AS
SELECT *, 0 as table_index FROM `orders_0`
UNION ALL
SELECT *, 1 as table_index FROM `orders_1`
UNION ALL
SELECT *, 2 as table_index FROM `orders_2`
UNION ALL
SELECT *, 3 as table_index FROM `orders_3`
UNION ALL
SELECT *, 4 as table_index FROM `orders_4`
UNION ALL
SELECT *, 5 as table_index FROM `orders_5`
UNION ALL
SELECT *, 6 as table_index FROM `orders_6`
UNION ALL
SELECT *, 7 as table_index FROM `orders_7`
UNION ALL
SELECT *, 8 as table_index FROM `orders_8`
UNION ALL
SELECT *, 9 as table_index FROM `orders_9`;

-- 创建分表路由函数
DELIMITER $$

DROP FUNCTION IF EXISTS GetOrderTableName$$

CREATE FUNCTION GetOrderTableName(client_id INT) 
RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE table_count INT DEFAULT 10;
    DECLARE table_index INT;
    
    -- 获取分表数量
    SELECT `table_count` INTO table_count FROM `order_sharding_config` WHERE `id` = 1;
    
    -- 计算表索引
    SET table_index = client_id % table_count;
    
    RETURN CONCAT('orders_', table_index);
END$$

DELIMITER ;

-- 示例查询函数
DELIMITER $$

DROP PROCEDURE IF EXISTS GetOrdersByClientId$$

CREATE PROCEDURE GetOrdersByClientId(IN client_id INT, IN limit_count INT)
BEGIN
    DECLARE table_name VARCHAR(20);
    
    SET table_name = GetOrderTableName(client_id);
    
    SET @sql = CONCAT('
        SELECT * FROM `', table_name, '` 
        WHERE dxm_client_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
    ');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt USING client_id, limit_count;
    DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;


