#!/usr/bin/env node

/**
 * 邮箱提取系统
 * 从已发现的Shopify独立站中提取联系邮箱
 */

const axios = require('axios');
const cheerio = require('cheerio');
const mysql = require('mysql2/promise');
const validator = require('validator');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config/.env') });

class EmailExtractor {
  constructor() {
    this.config = {
      delay: parseInt(process.env.REQUEST_DELAY) || 2000,
      timeout: 10000,
      userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    // 邮箱正则表达式
    this.emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    
    // 常见的商务邮箱前缀
    this.businessPrefixes = [
      'info', 'contact', 'hello', 'support', 'sales', 'business', 
      'partnership', 'wholesale', 'b2b', 'admin', 'service',
      // 德语
      'kontakt', 'vertrieb', 'kundenservice', 'bestellung',
      // 法语
      'contact', 'commercial', 'vente', 'service',
      // 意大利语
      'contatto', 'vendite', 'commerciale', 'servizio',
      // 西班牙语
      'contacto', 'ventas', 'comercial', 'servicio'
    ];

    // 要检查的页面路径（多语言支持）
    this.contactPages = [
      // 英语
      '/contact', '/contact-us', '/about', '/about-us', '/support', 
      '/help', '/customer-service', '/wholesale', '/b2b',
      // 德语
      '/kontakt', '/uber-uns', '/impressum', '/kundenservice', '/hilfe',
      // 法语
      '/contact', '/nous-contacter', '/a-propos', '/service-client',
      // 意大利语
      '/contatto', '/chi-siamo', '/servizio-clienti', '/aiuto',
      // 西班牙语
      '/contacto', '/sobre-nosotros', '/servicio-al-cliente', '/ayuda',
      // 荷兰语
      '/contact', '/over-ons', '/klantenservice', '/hulp'
    ];

    this.db = null;
  }

  // 数据库连接
  async connectDB() {
    try {
      this.db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'syntaxdropshipping_promotion',
        port: process.env.DB_PORT || 3306
      });
      console.log('✅ Database connected');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 安全HTTP请求
  async safeRequest(url, options = {}) {
    const config = {
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await axios.get(url, config);
      return response;
    } catch (error) {
      // 只记录非404错误
      if (error.response?.status !== 404) {
        console.error(`❌ Request failed for ${url}: ${error.message}`);
      }
      return null;
    }
  }

  // 1. 从数据库获取待处理的网站
  async getWebsitesToProcess(limit = 50) {
    try {
      const query = `
        SELECT w.id, w.url, w.domain, w.country_code, w.language
        FROM discovered_websites w
        LEFT JOIN extracted_emails e ON w.id = e.website_id
        WHERE w.platform = 'shopify' 
          AND w.status = 'active'
          AND e.website_id IS NULL
        ORDER BY w.discovery_date DESC
        LIMIT ?
      `;
      
      const [rows] = await this.db.execute(query, [limit]);
      return rows;
    } catch (error) {
      console.error('❌ Error fetching websites:', error.message);
      return [];
    }
  }

  // 2. 从页面内容中提取邮箱
  extractEmailsFromContent(content, sourceUrl = '') {
    const emails = [];
    const matches = content.match(this.emailRegex) || [];
    
    matches.forEach(email => {
      email = email.toLowerCase().trim();
      
      // 基本验证
      if (!validator.isEmail(email)) return;
      
      // 过滤掉明显的垃圾邮箱
      if (this.isJunkEmail(email)) return;
      
      // 确定邮箱类型
      const emailType = this.determineEmailType(email);
      
      emails.push({
        email,
        type: emailType,
        source: sourceUrl
      });
    });
    
    return emails;
  }

  // 3. 判断是否为垃圾邮箱
  isJunkEmail(email) {
    const junkPatterns = [
      // 常见的无效邮箱
      'noreply', 'no-reply', 'donotreply', 'example.com',
      'test@', 'admin@localhost', 'user@domain',
      // 隐私保护邮箱
      'privacy', 'whoisguard', 'domainprivacy',
      // 自动生成的邮箱
      'wordpress', 'shopify-email', 'notifications@'
    ];
    
    return junkPatterns.some(pattern => email.includes(pattern));
  }

  // 4. 确定邮箱类型
  determineEmailType(email) {
    const prefix = email.split('@')[0].toLowerCase();
    
    // 检查是否为商务邮箱前缀
    for (const businessPrefix of this.businessPrefixes) {
      if (prefix.includes(businessPrefix)) {
        if (prefix.includes('info')) return 'info';
        if (prefix.includes('contact')) return 'contact';
        if (prefix.includes('support')) return 'support';
        if (prefix.includes('sales') || prefix.includes('vertrieb') || prefix.includes('vente')) return 'sales';
        return 'other';
      }
    }
    
    return 'other';
  }

  // 5. 从特定页面提取邮箱
  async extractFromPage(baseUrl, pagePath) {
    try {
      const fullUrl = new URL(pagePath, baseUrl).href;
      const response = await this.safeRequest(fullUrl);
      
      if (!response || response.status !== 200) {
        return [];
      }

      const $ = cheerio.load(response.data);
      const content = response.data;
      
      // 从HTML内容提取邮箱
      const emails = this.extractEmailsFromContent(content, fullUrl);
      
      // 从特定元素提取邮箱
      const specificEmails = [];
      
      // 检查mailto链接
      $('a[href^="mailto:"]').each((i, el) => {
        const href = $(el).attr('href');
        const email = href.replace('mailto:', '').split('?')[0].toLowerCase();
        if (validator.isEmail(email) && !this.isJunkEmail(email)) {
          specificEmails.push({
            email,
            type: this.determineEmailType(email),
            source: fullUrl,
            method: 'mailto_link'
          });
        }
      });
      
      // 检查联系表单中的提示邮箱
      $('.contact-form, .contact-info, .footer').each((i, el) => {
        const text = $(el).text();
        const formEmails = this.extractEmailsFromContent(text, fullUrl);
        specificEmails.push(...formEmails.map(e => ({...e, method: 'form_context'})));
      });

      return [...emails, ...specificEmails];
    } catch (error) {
      console.error(`❌ Error extracting from ${pagePath}:`, error.message);
      return [];
    }
  }

  // 6. 从网站主页提取邮箱
  async extractFromHomepage(url) {
    try {
      const response = await this.safeRequest(url);
      if (!response) return [];

      const $ = cheerio.load(response.data);
      const content = response.data;
      
      const emails = this.extractEmailsFromContent(content, url);
      
      // 检查页脚和联系信息区域
      const footerEmails = [];
      $('.footer, .contact, .contact-info, [class*="contact"]').each((i, el) => {
        const text = $(el).text();
        const sectionEmails = this.extractEmailsFromContent(text, url);
        footerEmails.push(...sectionEmails.map(e => ({...e, method: 'homepage_section'})));
      });

      return [...emails, ...footerEmails];
    } catch (error) {
      console.error(`❌ Error extracting from homepage:`, error.message);
      return [];
    }
  }

  // 7. 验证邮箱有效性
  async verifyEmail(email) {
    // 基本格式验证
    if (!validator.isEmail(email)) {
      return { valid: false, score: 0, status: 'invalid' };
    }

    // 如果有第三方验证API，在这里调用
    if (process.env.HUNTER_API_KEY) {
      try {
        const response = await axios.get('https://api.hunter.io/v2/email-verifier', {
          params: {
            email: email,
            api_key: process.env.HUNTER_API_KEY
          }
        });

        if (response.data && response.data.data) {
          const result = response.data.data;
          return {
            valid: result.result === 'deliverable',
            score: result.score / 100,
            status: result.result,
            deliverability: result.result
          };
        }
      } catch (error) {
        console.error(`❌ Email verification API error for ${email}:`, error.message);
      }
    }

    // 基本验证
    const domain = email.split('@')[1];
    const isBusinessEmail = !this.isGenericProvider(domain);
    
    return {
      valid: true,
      score: isBusinessEmail ? 0.8 : 0.5,
      status: 'unknown',
      deliverability: 'unknown'
    };
  }

  // 8. 判断是否为通用邮箱提供商
  isGenericProvider(domain) {
    const genericProviders = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'web.de', 'gmx.de', 't-online.de', 'freenet.de',
      'orange.fr', 'laposte.net', 'free.fr', 'wanadoo.fr',
      'libero.it', 'tiscali.it', 'virgilio.it', 'alice.it',
      'terra.es', 'ya.com', 'telefonica.net'
    ];
    
    return genericProviders.includes(domain.toLowerCase());
  }

  // 9. 保存邮箱到数据库
  async saveEmail(websiteId, emailData, verification) {
    try {
      const query = `
        INSERT INTO extracted_emails 
        (website_id, email, email_type, source_page, extraction_method, 
         verification_status, verification_score, deliverability_status, 
         is_business_email, is_generic)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        verification_status = VALUES(verification_status),
        verification_score = VALUES(verification_score),
        updated_at = CURRENT_TIMESTAMP
      `;

      const domain = emailData.email.split('@')[1];
      const isGeneric = this.isGenericProvider(domain);
      
      await this.db.execute(query, [
        websiteId,
        emailData.email,
        emailData.type || 'other',
        emailData.source || '',
        emailData.method || 'content_extraction',
        verification.status || 'pending',
        verification.score || 0,
        verification.deliverability || 'unknown',
        !isGeneric,
        isGeneric
      ]);

      return true;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        // 邮箱已存在，忽略
        return true;
      }
      console.error(`❌ Error saving email ${emailData.email}:`, error.message);
      return false;
    }
  }

  // 10. 处理单个网站的邮箱提取
  async processWebsite(website) {
    console.log(`🔍 Processing: ${website.url}`);
    
    try {
      const allEmails = new Map(); // 使用Map去重
      
      // 1. 从主页提取
      const homepageEmails = await this.extractFromHomepage(website.url);
      homepageEmails.forEach(email => {
        allEmails.set(email.email, email);
      });
      
      // 2. 从特定页面提取
      for (const pagePath of this.contactPages) {
        try {
          const pageEmails = await this.extractFromPage(website.url, pagePath);
          pageEmails.forEach(email => {
            allEmails.set(email.email, email);
          });
          
          await this.delay(1000); // 页面间延迟
        } catch (error) {
          // 忽略单个页面的错误
        }
      }

      // 3. 验证和保存邮箱
      const savedEmails = [];
      for (const [emailAddress, emailData] of allEmails) {
        try {
          const verification = await this.verifyEmail(emailAddress);
          const saved = await this.saveEmail(website.id, emailData, verification);
          
          if (saved) {
            savedEmails.push({
              email: emailAddress,
              type: emailData.type,
              score: verification.score
            });
          }
          
          await this.delay(500); // 验证间延迟
        } catch (error) {
          console.error(`❌ Error processing email ${emailAddress}:`, error.message);
        }
      }

      console.log(`  ✅ Found ${savedEmails.length} valid emails`);
      return savedEmails;

    } catch (error) {
      console.error(`❌ Error processing website ${website.url}:`, error.message);
      return [];
    }
  }

  // 11. 主提取流程
  async extract(limit = 50) {
    console.log('📧 Starting email extraction...\n');

    try {
      await this.connectDB();

      // 获取待处理的网站
      const websites = await this.getWebsitesToProcess(limit);
      console.log(`📋 Found ${websites.length} websites to process\n`);

      if (websites.length === 0) {
        console.log('ℹ️  No websites to process. Run discovery first.');
        return [];
      }

      const results = [];
      let processed = 0;

      for (const website of websites) {
        processed++;
        console.log(`Processing ${processed}/${websites.length}`);
        
        const emails = await this.processWebsite(website);
        results.push({
          website: website.url,
          domain: website.domain,
          country: website.country_code,
          emails: emails
        });

        await this.delay(this.config.delay);
      }

      return results;

    } catch (error) {
      console.error('❌ Email extraction failed:', error.message);
      throw error;
    } finally {
      if (this.db) {
        await this.db.end();
      }
    }
  }

  // 12. 生成提取报告
  async generateReport(results) {
    console.log('\n📊 Email Extraction Report');
    console.log('==========================');
    
    const totalEmails = results.reduce((sum, r) => sum + r.emails.length, 0);
    const sitesWithEmails = results.filter(r => r.emails.length > 0).length;
    
    console.log(`Total websites processed: ${results.length}`);
    console.log(`Websites with emails found: ${sitesWithEmails}`);
    console.log(`Total emails extracted: ${totalEmails}`);
    
    // 按国家统计
    const byCountry = {};
    results.forEach(result => {
      const country = result.country || 'Unknown';
      byCountry[country] = (byCountry[country] || 0) + result.emails.length;
    });

    console.log('\n🌍 Emails by Country:');
    Object.entries(byCountry).forEach(([country, count]) => {
      console.log(`  ${country}: ${count} emails`);
    });

    // 按邮箱类型统计
    const byType = {};
    results.forEach(result => {
      result.emails.forEach(email => {
        byType[email.type] = (byType[email.type] || 0) + 1;
      });
    });

    console.log('\n📧 Emails by Type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} emails`);
    });

    // 显示高质量邮箱示例
    const highQualityEmails = [];
    results.forEach(result => {
      result.emails.forEach(email => {
        if (email.score > 0.7) {
          highQualityEmails.push({
            website: result.domain,
            email: email.email,
            type: email.type,
            score: email.score
          });
        }
      });
    });

    if (highQualityEmails.length > 0) {
      console.log('\n⭐ High Quality Emails (score > 0.7):');
      highQualityEmails.slice(0, 10).forEach(email => {
        console.log(`  ${email.website}: ${email.email} (${email.type}, ${email.score})`);
      });
      
      if (highQualityEmails.length > 10) {
        console.log(`  ... and ${highQualityEmails.length - 10} more`);
      }
    }
  }
}

// 主执行函数
async function main() {
  const extractor = new EmailExtractor();
  
  try {
    const results = await extractor.extract(50);
    
    console.log('\n🎉 Email extraction completed!');
    
    if (results.length > 0) {
      await extractor.generateReport(results);
      
      console.log('\n📝 Next steps:');
      console.log('  1. Review extracted emails in database');
      console.log('  2. Set up email campaigns');
      console.log('  3. Start outreach to potential customers');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = EmailExtractor;









