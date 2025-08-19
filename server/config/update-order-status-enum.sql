-- 更新订单状态字段为枚举类型
-- 根据业务需求设置订单状态的有效值

-- 为每个分表更新订单状态字段
ALTER TABLE `orders_0` MODIFY COLUMN `order_status` ENUM(
  '全部',
  '未付款', 
  '风控中',
  '待审核',
  '待处理',
  '待打单（有货）',
  '待打单（缺货）',
  '待打单（异常）',
  '已发货',
  '已退款',
  '已忽略',
  '已处理',
  '已审核'
) DEFAULT NULL COMMENT '订单状态';

ALTER TABLE `orders_1` MODIFY COLUMN `order_status` ENUM(
  '全部',
  '未付款', 
  '风控中',
  '待审核',
  '待处理',
  '待打单（有货）',
  '待打单（缺货）',
  '待打单（异常）',
  '已发货',
  '已退款',
  '已忽略',
  '已处理',
  '已审核'
) DEFAULT NULL COMMENT '订单状态';

ALTER TABLE `orders_2` MODIFY COLUMN `order_status` ENUM(
  '全部',
  '未付款', 
  '风控中',
  '待审核',
  '待处理',
  '待打单（有货）',
  '待打单（缺货）',
  '待打单（异常）',
  '已发货',
  '已退款',
  '已忽略',
  '已处理',
  '已审核'
) DEFAULT NULL COMMENT '订单状态';

ALTER TABLE `orders_3` MODIFY COLUMN `order_status` ENUM(
  '全部',
  '未付款', 
  '风控中',
  '待审核',
  '待处理',
  '待打单（有货）',
  '待打单（缺货）',
  '待打单（异常）',
  '已发货',
  '已退款',
  '已忽略',
  '已处理',
  '已审核'
) DEFAULT NULL COMMENT '订单状态';

ALTER TABLE `orders_4` MODIFY COLUMN `order_status` ENUM(
  '全部',
  '未付款', 
  '风控中',
  '待审核',
  '待处理',
  '待打单（有货）',
  '待打单（缺货）',
  '待打单（异常）',
  '已发货',
  '已退款',
  '已忽略',
  '已处理',
  '已审核'
) DEFAULT NULL COMMENT '订单状态';

ALTER TABLE `orders_5` MODIFY COLUMN `order_status` ENUM(
  '全部',
  '未付款', 
  '风控中',
  '待审核',
  '待处理',
  '待打单（有货）',
  '待打单（缺货）',
  '待打单（异常）',
  '已发货',
  '已退款',
  '已忽略',
  '已处理',
  '已审核'
) DEFAULT NULL COMMENT '订单状态';

ALTER TABLE `orders_6` MODIFY COLUMN `order_status` ENUM(
  '全部',
  '未付款', 
  '风控中',
  '待审核',
  '待处理',
  '待打单（有货）',
  '待打单（缺货）',
  '待打单（异常）',
  '已发货',
  '已退款',
  '已忽略',
  '已处理',
  '已审核'
) DEFAULT NULL COMMENT '订单状态';

ALTER TABLE `orders_7` MODIFY COLUMN `order_status` ENUM(
  '全部',
  '未付款', 
  '风控中',
  '待审核',
  '待处理',
  '待打单（有货）',
  '待打单（缺货）',
  '待打单（异常）',
  '已发货',
  '已退款',
  '已忽略',
  '已处理',
  '已审核'
) DEFAULT NULL COMMENT '订单状态';

ALTER TABLE `orders_8` MODIFY COLUMN `order_status` ENUM(
  '全部',
  '未付款', 
  '风控中',
  '待审核',
  '待处理',
  '待打单（有货）',
  '待打单（缺货）',
  '待打单（异常）',
  '已发货',
  '已退款',
  '已忽略',
  '已处理',
  '已审核'
) DEFAULT NULL COMMENT '订单状态';

ALTER TABLE `orders_9` MODIFY COLUMN `order_status` ENUM(
  '全部',
  '未付款', 
  '风控中',
  '待审核',
  '待处理',
  '待打单（有货）',
  '待打单（缺货）',
  '待打单（异常）',
  '已发货',
  '已退款',
  '已忽略',
  '已处理',
  '已审核'
) DEFAULT NULL COMMENT '订单状态';
