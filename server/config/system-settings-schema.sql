-- 系统设置表
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL COMMENT '设置键名',
  `setting_value` text COMMENT '设置值（JSON格式）',
  `setting_type` enum('payment_info', 'general', 'notification', 'security') DEFAULT 'general' COMMENT '设置类型',
  `description` varchar(255) COMMENT '设置描述',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '是否启用',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_setting_key` (`setting_key`),
  KEY `idx_setting_type` (`setting_type`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统设置表';

-- 插入默认支付信息设置
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_type`, `description`) VALUES 
('payment_usd_bank_transfer', '{"account_number":"","holder_name":"","bank":"","bank_address":"","swift_code":"","routing_number":"","account_type":"Business Account","currency":"USD","is_enabled":true}', 'payment_info', 'USD银行转账支付信息'),
('payment_eur_bank_transfer', '{"account_number":"","holder_name":"","bank":"","bank_address":"","swift_code":"","iban":"","currency":"EUR","account_type":"Business Account","is_enabled":true}', 'payment_info', 'EUR银行转账支付信息'),
('payment_paypal', '{"account_email":"","account_name":"","currency":"USD","is_enabled":true}', 'payment_info', 'PayPal支付信息')
ON DUPLICATE KEY UPDATE 
  `setting_value` = VALUES(`setting_value`),
  `updated_at` = CURRENT_TIMESTAMP;
