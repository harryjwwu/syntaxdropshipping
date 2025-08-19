-- 将remark字段从JSON类型改为TEXT类型
-- 保持数据内容不变，但改变存储格式

-- 为每个分表更新remark字段类型
ALTER TABLE `orders_0` MODIFY COLUMN `remark` TEXT COMMENT '备注信息：JSON格式字符串 {customer_remark, picking_remark, order_remark}';

ALTER TABLE `orders_1` MODIFY COLUMN `remark` TEXT COMMENT '备注信息：JSON格式字符串 {customer_remark, picking_remark, order_remark}';

ALTER TABLE `orders_2` MODIFY COLUMN `remark` TEXT COMMENT '备注信息：JSON格式字符串 {customer_remark, picking_remark, order_remark}';

ALTER TABLE `orders_3` MODIFY COLUMN `remark` TEXT COMMENT '备注信息：JSON格式字符串 {customer_remark, picking_remark, order_remark}';

ALTER TABLE `orders_4` MODIFY COLUMN `remark` TEXT COMMENT '备注信息：JSON格式字符串 {customer_remark, picking_remark, order_remark}';

ALTER TABLE `orders_5` MODIFY COLUMN `remark` TEXT COMMENT '备注信息：JSON格式字符串 {customer_remark, picking_remark, order_remark}';

ALTER TABLE `orders_6` MODIFY COLUMN `remark` TEXT COMMENT '备注信息：JSON格式字符串 {customer_remark, picking_remark, order_remark}';

ALTER TABLE `orders_7` MODIFY COLUMN `remark` TEXT COMMENT '备注信息：JSON格式字符串 {customer_remark, picking_remark, order_remark}';

ALTER TABLE `orders_8` MODIFY COLUMN `remark` TEXT COMMENT '备注信息：JSON格式字符串 {customer_remark, picking_remark, order_remark}';

ALTER TABLE `orders_9` MODIFY COLUMN `remark` TEXT COMMENT '备注信息：JSON格式字符串 {customer_remark, picking_remark, order_remark}';
