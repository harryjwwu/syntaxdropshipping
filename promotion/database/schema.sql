-- 欧洲Shopify独立站推广系统数据库架构

-- 使用现有的syntaxdropshipping数据库
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
    estimated_monthly_visits INT DEFAULT 0,
    alexa_rank INT DEFAULT 0,
    tech_stack JSON,
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
    INDEX idx_status (status),
    INDEX idx_discovery_date (discovery_date)
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
    deliverability_status VARCHAR(50),
    is_business_email BOOLEAN DEFAULT FALSE,
    is_generic BOOLEAN DEFAULT FALSE,
    domain_authority INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (website_id) REFERENCES discovered_websites(id) ON DELETE CASCADE,
    UNIQUE KEY unique_website_email (website_id, email),
    INDEX idx_email (email),
    INDEX idx_verification_status (verification_status),
    INDEX idx_business_email (is_business_email),
    INDEX idx_website_id (website_id)
);

-- 3. 联系人信息表
CREATE TABLE IF NOT EXISTS contact_persons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    website_id INT NOT NULL,
    email_id INT,
    name VARCHAR(255),
    position VARCHAR(255),
    phone VARCHAR(50),
    linkedin_url VARCHAR(500),
    social_media JSON,
    source VARCHAR(100),
    confidence_score DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (website_id) REFERENCES discovered_websites(id) ON DELETE CASCADE,
    FOREIGN KEY (email_id) REFERENCES extracted_emails(id) ON DELETE SET NULL,
    INDEX idx_website_id (website_id),
    INDEX idx_email_id (email_id),
    INDEX idx_name (name)
);

-- 4. 推广活动表
CREATE TABLE IF NOT EXISTS promotion_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_countries JSON,
    target_platforms JSON,
    email_template_id INT,
    status ENUM('draft', 'active', 'paused', 'completed') DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    total_targets INT DEFAULT 0,
    emails_sent INT DEFAULT 0,
    emails_opened INT DEFAULT 0,
    emails_clicked INT DEFAULT 0,
    replies_received INT DEFAULT 0,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_created_by (created_by)
);

-- 5. 邮件模板表
CREATE TABLE IF NOT EXISTS email_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT,
    body_text TEXT,
    language VARCHAR(10) DEFAULT 'en',
    template_type ENUM('introduction', 'follow_up', 'case_study', 'demo') DEFAULT 'introduction',
    variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_template_type (template_type),
    INDEX idx_language (language),
    INDEX idx_is_active (is_active)
);

-- 6. 推广记录表
CREATE TABLE IF NOT EXISTS promotion_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    website_id INT NOT NULL,
    email_id INT NOT NULL,
    template_id INT NOT NULL,
    sent_at TIMESTAMP NULL,
    opened_at TIMESTAMP NULL,
    clicked_at TIMESTAMP NULL,
    replied_at TIMESTAMP NULL,
    bounced_at TIMESTAMP NULL,
    status ENUM('pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed') DEFAULT 'pending',
    tracking_id VARCHAR(100),
    response_text TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES promotion_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (website_id) REFERENCES discovered_websites(id) ON DELETE CASCADE,
    FOREIGN KEY (email_id) REFERENCES extracted_emails(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE CASCADE,
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_website_id (website_id),
    INDEX idx_email_id (email_id),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
);

-- 7. 系统配置表
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_setting_key (setting_key),
    INDEX idx_is_public (is_public)
);

-- 8. 任务队列表
CREATE TABLE IF NOT EXISTS task_queue (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_type ENUM('discovery', 'email_extraction', 'email_verification', 'email_sending') NOT NULL,
    task_data JSON,
    status ENUM('pending', 'processing', 'completed', 'failed', 'retrying') DEFAULT 'pending',
    priority INT DEFAULT 5,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_task_type (task_type),
    INDEX idx_status (status),
    INDEX idx_scheduled_at (scheduled_at),
    INDEX idx_priority (priority)
);

-- 插入默认配置
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('discovery_delay_ms', '2000', 'number', '网站发现请求间隔（毫秒）', FALSE),
('max_concurrent_requests', '5', 'number', '最大并发请求数', FALSE),
('email_verification_enabled', 'true', 'boolean', '是否启用邮箱验证', FALSE),
('default_email_template', '1', 'number', '默认邮件模板ID', FALSE),
('target_countries', '["DE", "FR", "IT", "ES", "NL", "GB"]', 'json', '目标国家列表', TRUE),
('supported_platforms', '["shopify", "woocommerce", "magento"]', 'json', '支持的平台列表', TRUE);

-- 插入默认邮件模板
INSERT INTO email_templates (name, subject, body_html, body_text, language, template_type, variables) VALUES
('Shopify Introduction (English)', 
 'Reduce Your Fulfillment Costs by 40% - Syntax Dropshipping', 
 '<html><body><h2>Hello {{name}},</h2><p>I noticed your beautiful Shopify store <strong>{{website_name}}</strong> and wanted to reach out about an opportunity to significantly reduce your fulfillment costs.</p><p>We help European Shopify stores like yours:</p><ul><li>✅ Reduce fulfillment costs by up to 40%</li><li>✅ Fast 12-24 hour processing for stocked items</li><li>✅ Custom packaging with your branding</li><li>✅ Direct shipping from China with tracking</li></ul><p>Would you be interested in a quick 15-minute call to see how we can help optimize your fulfillment process?</p><p>Best regards,<br>{{sender_name}}<br>Syntax Dropshipping</p></body></html>',
 'Hello {{name}}, I noticed your Shopify store {{website_name}} and wanted to reach out about reducing your fulfillment costs by up to 40%. We offer fast processing, custom packaging, and direct shipping from China. Would you be interested in a 15-minute call? Best regards, {{sender_name}}',
 'en', 
 'introduction',
 '{"name": "Contact Name", "website_name": "Store Name", "sender_name": "Your Name"}'
),
('Shopify Introduction (German)', 
 'Reduzieren Sie Ihre Fulfillment-Kosten um 40% - Syntax Dropshipping', 
 '<html><body><h2>Hallo {{name}},</h2><p>Mir ist Ihr schöner Shopify-Store <strong>{{website_name}}</strong> aufgefallen und ich wollte Sie bezüglich einer Möglichkeit kontaktieren, Ihre Fulfillment-Kosten erheblich zu reduzieren.</p><p>Wir helfen europäischen Shopify-Stores wie Ihrem:</p><ul><li>✅ Fulfillment-Kosten um bis zu 40% reduzieren</li><li>✅ Schnelle 12-24 Stunden Bearbeitung für lagernde Artikel</li><li>✅ Individuelle Verpackung mit Ihrem Branding</li><li>✅ Direktversand aus China mit Tracking</li></ul><p>Wären Sie an einem kurzen 15-minütigen Gespräch interessiert, um zu sehen, wie wir Ihren Fulfillment-Prozess optimieren können?</p><p>Mit freundlichen Grüßen,<br>{{sender_name}}<br>Syntax Dropshipping</p></body></html>',
 'Hallo {{name}}, mir ist Ihr Shopify-Store {{website_name}} aufgefallen. Wir können Ihre Fulfillment-Kosten um bis zu 40% reduzieren mit schneller Bearbeitung, individueller Verpackung und Direktversand aus China. Interesse an einem 15-minütigen Gespräch? Mit freundlichen Grüßen, {{sender_name}}',
 'de', 
 'introduction',
 '{"name": "Kontaktname", "website_name": "Store Name", "sender_name": "Ihr Name"}'
);
