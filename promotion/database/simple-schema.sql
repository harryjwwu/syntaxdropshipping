-- 简化版数据库架构用于测试
USE syntaxdropshipping;

-- 1. 发现的网站表
CREATE TABLE IF NOT EXISTS discovered_websites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    url VARCHAR(500) NOT NULL UNIQUE,
    domain VARCHAR(255) NOT NULL,
    platform VARCHAR(50) DEFAULT 'shopify',
    country_code VARCHAR(2),
    country_name VARCHAR(100),
    language VARCHAR(10),
    title VARCHAR(500),
    description TEXT,
    category VARCHAR(100),
    discovery_method VARCHAR(100),
    discovery_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive', 'error', 'blocked') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_domain (domain),
    INDEX idx_country (country_code),
    INDEX idx_platform (platform),
    INDEX idx_status (status)
);

-- 2. 提取的邮箱表
CREATE TABLE IF NOT EXISTS extracted_emails (
    id INT PRIMARY KEY AUTO_INCREMENT,
    website_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    email_type ENUM('info', 'contact', 'support', 'sales', 'admin', 'other') DEFAULT 'other',
    source_page VARCHAR(500),
    extraction_method VARCHAR(100),
    verification_status ENUM('pending', 'valid', 'invalid', 'risky', 'unknown') DEFAULT 'pending',
    verification_score DECIMAL(3,2) DEFAULT 0.00,
    verification_date TIMESTAMP NULL,
    is_business_email BOOLEAN DEFAULT FALSE,
    is_generic BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (website_id) REFERENCES discovered_websites(id) ON DELETE CASCADE,
    UNIQUE KEY unique_website_email (website_id, email),
    INDEX idx_email (email),
    INDEX idx_verification_status (verification_status),
    INDEX idx_business_email (is_business_email)
);

-- 3. 联系人信息表
CREATE TABLE IF NOT EXISTS contact_persons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    website_id INT NOT NULL,
    email_id INT,
    name VARCHAR(255),
    phone VARCHAR(50),
    social_media TEXT,
    source VARCHAR(100),
    confidence_score DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (website_id) REFERENCES discovered_websites(id) ON DELETE CASCADE,
    FOREIGN KEY (email_id) REFERENCES extracted_emails(id) ON DELETE SET NULL,
    INDEX idx_website_id (website_id)
);

-- 插入测试数据
INSERT IGNORE INTO discovered_websites 
(url, domain, platform, country_code, country_name, language, title, category, discovery_method) 
VALUES 
('https://example-store.de', 'example-store.de', 'shopify', 'DE', 'Germany', 'de', 'Example Fashion Store', 'fashion', 'test_data'),
('https://test-boutique.fr', 'test-boutique.fr', 'shopify', 'FR', 'France', 'fr', 'Test Boutique', 'fashion', 'test_data'),
('https://demo-electronics.it', 'demo-electronics.it', 'shopify', 'IT', 'Italy', 'it', 'Demo Electronics', 'electronics', 'test_data');









