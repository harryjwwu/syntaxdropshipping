-- 钱包功能数据库扩展
-- 添加到现有的 syntaxdropshipping 数据库

USE syntaxdropshipping;

-- 用户钱包表
CREATE TABLE IF NOT EXISTS user_wallets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  frozen_balance DECIMAL(10,2) DEFAULT 0.00,
  total_deposited DECIMAL(10,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_wallet (user_id),
  INDEX idx_user_id (user_id)
);

-- 充值记录表
CREATE TABLE IF NOT EXISTS deposit_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  deposit_number VARCHAR(50) NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method ENUM('bank_transfer', 'paypal', 'wise', 'others') NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'rejected') DEFAULT 'pending',
  payment_slip VARCHAR(500) DEFAULT NULL, -- 支付凭证文件路径
  bank_info JSON DEFAULT NULL, -- 银行转账信息
  admin_notes TEXT DEFAULT NULL,
  admin_id INT DEFAULT NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_deposit_number (deposit_number),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- 钱包交易记录表（统一记录所有钱包变动）
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  transaction_number VARCHAR(50) NOT NULL UNIQUE,
  type ENUM('deposit', 'withdraw', 'commission', 'order_payment', 'refund') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id INT DEFAULT NULL, -- 关联的订单ID、充值ID等
  reference_type VARCHAR(50) DEFAULT NULL, -- 'deposit', 'order', 'commission'等
  status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_transaction_number (transaction_number),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- 系统银行账户信息表
CREATE TABLE IF NOT EXISTS system_bank_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  account_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  bank_address TEXT,
  swift_code VARCHAR(20),
  routing_number VARCHAR(20),
  branch_code VARCHAR(20),
  currency VARCHAR(3) DEFAULT 'USD',
  country VARCHAR(50) DEFAULT 'HONG KONG',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_currency (currency),
  INDEX idx_is_active (is_active)
);

-- 插入默认银行账户信息（基于您提供的截图）
INSERT INTO system_bank_accounts (
  account_name, account_number, bank_name, bank_address, 
  swift_code, routing_number, branch_code, currency, country
) VALUES (
  'GSRTRADINGCO.,LIMITED',
  '63003703665',
  'JPMorgan Chase Bank N.A., Hong Kong Branch',
  '18/F, 20/F, 22-29/F, CHATER HOUSE, 8 CONNAUGHT ROAD CENTRAL, HONG KONG',
  'CHASHKHH',
  '007',
  '863',
  'USD',
  'HONG KONG'
) ON DUPLICATE KEY UPDATE
  account_name = VALUES(account_name),
  bank_name = VALUES(bank_name),
  bank_address = VALUES(bank_address);

-- 为现有用户创建钱包
INSERT INTO user_wallets (user_id, balance)
SELECT id, 0.00
FROM users
WHERE id NOT IN (SELECT user_id FROM user_wallets);
