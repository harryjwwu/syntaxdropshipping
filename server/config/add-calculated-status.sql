-- 为订单表添加 calculated 状态
-- 执行时间: 2025-01-XX

-- 更新所有订单分表的 settlement_status 字段枚举值
ALTER TABLE orders_0 MODIFY COLUMN settlement_status ENUM('waiting','cancel','calculated','settled') DEFAULT 'waiting' COMMENT '结算状态';
ALTER TABLE orders_1 MODIFY COLUMN settlement_status ENUM('waiting','cancel','calculated','settled') DEFAULT 'waiting' COMMENT '结算状态';
ALTER TABLE orders_2 MODIFY COLUMN settlement_status ENUM('waiting','cancel','calculated','settled') DEFAULT 'waiting' COMMENT '结算状态';
ALTER TABLE orders_3 MODIFY COLUMN settlement_status ENUM('waiting','cancel','calculated','settled') DEFAULT 'waiting' COMMENT '结算状态';
ALTER TABLE orders_4 MODIFY COLUMN settlement_status ENUM('waiting','cancel','calculated','settled') DEFAULT 'waiting' COMMENT '结算状态';
ALTER TABLE orders_5 MODIFY COLUMN settlement_status ENUM('waiting','cancel','calculated','settled') DEFAULT 'waiting' COMMENT '结算状态';
ALTER TABLE orders_6 MODIFY COLUMN settlement_status ENUM('waiting','cancel','calculated','settled') DEFAULT 'waiting' COMMENT '结算状态';
ALTER TABLE orders_7 MODIFY COLUMN settlement_status ENUM('waiting','cancel','calculated','settled') DEFAULT 'waiting' COMMENT '结算状态';
ALTER TABLE orders_8 MODIFY COLUMN settlement_status ENUM('waiting','cancel','calculated','settled') DEFAULT 'waiting' COMMENT '结算状态';
ALTER TABLE orders_9 MODIFY COLUMN settlement_status ENUM('waiting','cancel','calculated','settled') DEFAULT 'waiting' COMMENT '结算状态';

-- 验证修改结果
SHOW COLUMNS FROM orders_7 LIKE 'settlement_status';
