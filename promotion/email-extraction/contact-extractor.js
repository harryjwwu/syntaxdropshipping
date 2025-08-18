#!/usr/bin/env node

/**
 * 全方位联系方式提取系统
 * 提取邮箱、WhatsApp、电话、社交媒体等所有可能的联系方式
 */

const axios = require('axios');
const cheerio = require('cheerio');
const mysql = require('mysql2/promise');
const validator = require('validator');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config/.env') });

class ContactExtractor {
  constructor() {
    this.config = {
      delay: parseInt(process.env.REQUEST_DELAY) || 2000,
      timeout: 10000,
      userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    // 各种联系方式的正则表达式
    this.patterns = {
      // 邮箱
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      
      // WhatsApp (各种格式)
      whatsapp: [
        /whatsapp[:\s]*\+?[\d\s\-\(\)]{10,20}/gi,
        /wa\.me\/[\+\d]{10,20}/gi,
        /api\.whatsapp\.com\/send\?phone=[\+\d]{10,20}/gi,
        /\+[\d\s\-\(\)]{10,20}.*whatsapp/gi,
        /whatsapp.*\+[\d\s\-\(\)]{10,20}/gi
      ],
      
      // 电话号码 (国际格式)
      phone: [
        /\+[\d\s\-\(\)]{10,20}/g,
        /\b[\d\s\-\(\)]{10,15}\b/g,
        // 欧洲国家特定格式
        /\b0[\d\s\-\(\)]{9,14}\b/g, // 德国、法国等
        /\b[\d]{2,4}[\s\-][\d]{3,4}[\s\-][\d]{4,6}\b/g
      ],
      
      // Telegram
      telegram: [
        /t\.me\/[\w\d_]+/gi,
        /telegram[:\s]*@[\w\d_]+/gi,
        /telegram[:\s]*[\+\d\s\-\(\)]{10,20}/gi
      ],
      
      // Skype
      skype: [
        /skype[:\s]*[\w\d\._-]+/gi,
        /live:[\w\d\._-]+/gi
      ],
      
      // 社交媒体
      instagram: [
        /instagram\.com\/[\w\d\._]+/gi,
        /@[\w\d\._]+.*instagram/gi,
        /ig[:\s]*@[\w\d\._]+/gi
      ],
      
      facebook: [
        /facebook\.com\/[\w\d\._]+/gi,
        /fb\.com\/[\w\d\._]+/gi,
        /fb[:\s]*\/[\w\d\._]+/gi
      ],
      
      linkedin: [
        /linkedin\.com\/(?:in|company)\/[\w\d\-_]+/gi,
        /linkedin[:\s]*\/[\w\d\-_]+/gi
      ],
      
      twitter: [
        /twitter\.com\/[\w\d_]+/gi,
        /@[\w\d_]+.*twitter/gi,
        /twitter[:\s]*@[\w\d_]+/gi
      ]
    };

    // 要检查的页面 (多语言)
    this.contactPages = [
      // 英语
      '/contact', '/contact-us', '/about', '/about-us', '/support', 
      '/help', '/customer-service', '/wholesale', '/b2b', '/team',
      '/impressum', '/legal', '/privacy',
      
      // 德语
      '/kontakt', '/uber-uns', '/impressum', '/kundenservice', '/hilfe',
      '/team', '/unternehmen', '/datenschutz',
      
      // 法语
      '/contact', '/nous-contacter', '/a-propos', '/service-client',
      '/equipe', '/entreprise', '/mentions-legales',
      
      // 意大利语
      '/contatto', '/chi-siamo', '/servizio-clienti', '/aiuto',
      '/squadra', '/azienda', '/privacy',
      
      // 西班牙语
      '/contacto', '/sobre-nosotros', '/servicio-al-cliente', '/ayuda',
      '/equipo', '/empresa', '/privacidad',
      
      // 荷兰语
      '/contact', '/over-ons', '/klantenservice', '/hulp',
      '/team', '/bedrijf', '/privacy'
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
      if (error.response?.status !== 404) {
        console.error(`❌ Request failed for ${url}: ${error.message}`);
      }
      return null;
    }
  }

  // 1. 从内容中提取所有联系方式
  extractContactsFromContent(content, sourceUrl = '') {
    const contacts = {
      emails: [],
      whatsapp: [],
      phones: [],
      telegram: [],
      skype: [],
      social: {
        instagram: [],
        facebook: [],
        linkedin: [],
        twitter: []
      }
    };

    // 提取邮箱
    const emailMatches = content.match(this.patterns.email) || [];
    emailMatches.forEach(email => {
      email = email.toLowerCase().trim();
      if (validator.isEmail(email) && !this.isJunkEmail(email)) {
        contacts.emails.push({
          value: email,
          type: this.determineEmailType(email),
          source: sourceUrl
        });
      }
    });

    // 提取WhatsApp
    this.patterns.whatsapp.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => {
        const cleaned = this.cleanWhatsAppNumber(match);
        if (cleaned && this.isValidWhatsApp(cleaned)) {
          contacts.whatsapp.push({
            value: cleaned,
            original: match,
            source: sourceUrl
          });
        }
      });
    });

    // 提取电话号码
    this.patterns.phone.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => {
        const cleaned = this.cleanPhoneNumber(match);
        if (cleaned && this.isValidPhone(cleaned)) {
          contacts.phones.push({
            value: cleaned,
            original: match,
            source: sourceUrl
          });
        }
      });
    });

    // 提取Telegram
    this.patterns.telegram.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => {
        contacts.telegram.push({
          value: match.trim(),
          source: sourceUrl
        });
      });
    });

    // 提取Skype
    this.patterns.skype.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => {
        contacts.skype.push({
          value: match.trim(),
          source: sourceUrl
        });
      });
    });

    // 提取社交媒体
    Object.keys(contacts.social).forEach(platform => {
      this.patterns[platform].forEach(pattern => {
        const matches = content.match(pattern) || [];
        matches.forEach(match => {
          contacts.social[platform].push({
            value: match.trim(),
            source: sourceUrl
          });
        });
      });
    });

    return contacts;
  }

  // 2. 清理和验证WhatsApp号码
  cleanWhatsAppNumber(text) {
    // 提取数字和+号
    let number = text.replace(/[^\d+]/g, '');
    
    // 如果没有+号，尝试添加国际前缀
    if (!number.startsWith('+')) {
      // 根据常见的欧洲国家代码添加前缀
      if (number.startsWith('49')) number = '+' + number; // 德国
      else if (number.startsWith('33')) number = '+' + number; // 法国
      else if (number.startsWith('39')) number = '+' + number; // 意大利
      else if (number.startsWith('34')) number = '+' + number; // 西班牙
      else if (number.startsWith('31')) number = '+' + number; // 荷兰
      else if (number.startsWith('44')) number = '+' + number; // 英国
      else if (number.length >= 10) number = '+' + number; // 其他情况
    }
    
    return number;
  }

  // 3. 验证WhatsApp号码
  isValidWhatsApp(number) {
    // WhatsApp号码应该是10-15位数字，包含国家代码
    const cleaned = number.replace(/[^\d]/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  // 4. 清理电话号码
  cleanPhoneNumber(text) {
    // 保留数字、+号、空格、连字符和括号
    let number = text.replace(/[^\d+\s\-\(\)]/g, '').trim();
    
    // 移除多余的空格
    number = number.replace(/\s+/g, ' ');
    
    return number;
  }

  // 5. 验证电话号码
  isValidPhone(number) {
    const cleaned = number.replace(/[^\d]/g, '');
    return cleaned.length >= 7 && cleaned.length <= 15;
  }

  // 6. 判断是否为垃圾邮箱
  isJunkEmail(email) {
    const junkPatterns = [
      'noreply', 'no-reply', 'donotreply', 'example.com',
      'test@', 'admin@localhost', 'user@domain',
      'privacy', 'whoisguard', 'domainprivacy',
      'wordpress', 'shopify-email', 'notifications@'
    ];
    
    return junkPatterns.some(pattern => email.includes(pattern));
  }

  // 7. 确定邮箱类型
  determineEmailType(email) {
    const prefix = email.split('@')[0].toLowerCase();
    
    const businessPrefixes = {
      'info': 'info',
      'contact': 'contact', 
      'support': 'support',
      'sales': 'sales',
      'hello': 'contact',
      'service': 'support',
      'admin': 'admin'
    };

    for (const [key, type] of Object.entries(businessPrefixes)) {
      if (prefix.includes(key)) return type;
    }
    
    return 'other';
  }

  // 8. 从特定页面提取联系方式
  async extractFromPage(baseUrl, pagePath) {
    try {
      const fullUrl = new URL(pagePath, baseUrl).href;
      const response = await this.safeRequest(fullUrl);
      
      if (!response || response.status !== 200) {
        return null;
      }

      const $ = cheerio.load(response.data);
      const content = response.data;
      
      // 从HTML内容提取联系方式
      const contacts = this.extractContactsFromContent(content, fullUrl);
      
      // 从特定HTML元素提取
      this.extractFromSpecificElements($, contacts, fullUrl);
      
      return contacts;
    } catch (error) {
      console.error(`❌ Error extracting from ${pagePath}:`, error.message);
      return null;
    }
  }

  // 9. 从特定HTML元素提取联系方式
  extractFromSpecificElements($, contacts, sourceUrl) {
    // 检查mailto链接
    $('a[href^="mailto:"]').each((i, el) => {
      const href = $(el).attr('href');
      const email = href.replace('mailto:', '').split('?')[0].toLowerCase();
      if (validator.isEmail(email) && !this.isJunkEmail(email)) {
        contacts.emails.push({
          value: email,
          type: this.determineEmailType(email),
          source: sourceUrl,
          method: 'mailto_link'
        });
      }
    });

    // 检查WhatsApp链接
    $('a[href*="whatsapp"], a[href*="wa.me"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text() || '';
      
      // 从href提取
      if (href.includes('wa.me/') || href.includes('whatsapp.com/send')) {
        const number = this.extractWhatsAppFromUrl(href);
        if (number) {
          contacts.whatsapp.push({
            value: number,
            source: sourceUrl,
            method: 'whatsapp_link'
          });
        }
      }
      
      // 从链接文本提取
      const textContacts = this.extractContactsFromContent(text, sourceUrl);
      if (textContacts.whatsapp.length > 0) {
        contacts.whatsapp.push(...textContacts.whatsapp);
      }
    });

    // 检查电话链接
    $('a[href^="tel:"]').each((i, el) => {
      const href = $(el).attr('href');
      const number = href.replace('tel:', '').trim();
      const cleaned = this.cleanPhoneNumber(number);
      if (cleaned && this.isValidPhone(cleaned)) {
        contacts.phones.push({
          value: cleaned,
          source: sourceUrl,
          method: 'tel_link'
        });
      }
    });

    // 检查社交媒体链接
    $('a[href*="instagram.com"], a[href*="facebook.com"], a[href*="linkedin.com"], a[href*="twitter.com"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      
      if (href.includes('instagram.com')) {
        contacts.social.instagram.push({ value: href, source: sourceUrl, method: 'social_link' });
      } else if (href.includes('facebook.com')) {
        contacts.social.facebook.push({ value: href, source: sourceUrl, method: 'social_link' });
      } else if (href.includes('linkedin.com')) {
        contacts.social.linkedin.push({ value: href, source: sourceUrl, method: 'social_link' });
      } else if (href.includes('twitter.com')) {
        contacts.social.twitter.push({ value: href, source: sourceUrl, method: 'social_link' });
      }
    });
  }

  // 10. 从WhatsApp URL提取号码
  extractWhatsAppFromUrl(url) {
    try {
      // wa.me/1234567890
      if (url.includes('wa.me/')) {
        const match = url.match(/wa\.me\/(\+?\d+)/);
        if (match) return this.cleanWhatsAppNumber(match[1]);
      }
      
      // api.whatsapp.com/send?phone=1234567890
      if (url.includes('whatsapp.com/send')) {
        const match = url.match(/phone=(\+?\d+)/);
        if (match) return this.cleanWhatsAppNumber(match[1]);
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // 11. 保存联系方式到数据库
  async saveContacts(websiteId, contacts) {
    try {
      let savedCount = 0;

      // 保存邮箱
      for (const email of contacts.emails) {
        const saved = await this.saveEmail(websiteId, email);
        if (saved) savedCount++;
      }

      // 保存其他联系方式到contact_persons表
      if (contacts.whatsapp.length > 0 || contacts.phones.length > 0 || 
          Object.values(contacts.social).some(arr => arr.length > 0)) {
        
        const contactData = {
          whatsapp: contacts.whatsapp,
          phones: contacts.phones,
          telegram: contacts.telegram,
          skype: contacts.skype,
          social: contacts.social
        };

        const query = `
          INSERT INTO contact_persons 
          (website_id, phone, social_media, source, confidence_score)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          social_media = VALUES(social_media),
          updated_at = CURRENT_TIMESTAMP
        `;

        // 选择最好的电话号码
        const bestPhone = this.getBestPhone(contacts.phones, contacts.whatsapp);
        
        await this.db.execute(query, [
          websiteId,
          bestPhone,
          JSON.stringify(contactData),
          'automated_extraction',
          this.calculateContactScore(contacts)
        ]);

        savedCount++;
      }

      return savedCount;
    } catch (error) {
      console.error(`❌ Error saving contacts:`, error.message);
      return 0;
    }
  }

  // 12. 选择最佳电话号码
  getBestPhone(phones, whatsapp) {
    // 优先选择WhatsApp号码
    if (whatsapp.length > 0) {
      return whatsapp[0].value;
    }
    
    // 选择最长的电话号码（通常更完整）
    if (phones.length > 0) {
      return phones.sort((a, b) => b.value.length - a.value.length)[0].value;
    }
    
    return null;
  }

  // 13. 计算联系方式质量分数
  calculateContactScore(contacts) {
    let score = 0;
    
    // 邮箱分数
    score += contacts.emails.length * 0.3;
    
    // WhatsApp分数（高价值）
    score += contacts.whatsapp.length * 0.4;
    
    // 电话分数
    score += contacts.phones.length * 0.2;
    
    // 社交媒体分数
    const socialCount = Object.values(contacts.social).reduce((sum, arr) => sum + arr.length, 0);
    score += socialCount * 0.1;
    
    return Math.min(score, 1.0); // 最大1.0
  }

  // 14. 保存邮箱
  async saveEmail(websiteId, emailData) {
    try {
      const query = `
        INSERT INTO extracted_emails 
        (website_id, email, email_type, source_page, extraction_method, 
         verification_status, is_business_email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        updated_at = CURRENT_TIMESTAMP
      `;

      const domain = emailData.value.split('@')[1];
      const isGeneric = this.isGenericProvider(domain);
      
      await this.db.execute(query, [
        websiteId,
        emailData.value,
        emailData.type || 'other',
        emailData.source || '',
        emailData.method || 'content_extraction',
        'pending',
        !isGeneric
      ]);

      return true;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return true;
      }
      console.error(`❌ Error saving email ${emailData.value}:`, error.message);
      return false;
    }
  }

  // 15. 判断是否为通用邮箱提供商
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

  // 16. 从数据库获取待处理的网站
  async getWebsitesToProcess(limit = 50) {
    try {
      const query = `
        SELECT w.id, w.url, w.domain, w.country_code, w.language
        FROM discovered_websites w
        LEFT JOIN contact_persons cp ON w.id = cp.website_id
        WHERE w.platform = 'shopify' 
          AND w.status = 'active'
          AND cp.website_id IS NULL
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

  // 17. 处理单个网站
  async processWebsite(website) {
    console.log(`🔍 Processing: ${website.url}`);
    
    try {
      const allContacts = {
        emails: [],
        whatsapp: [],
        phones: [],
        telegram: [],
        skype: [],
        social: {
          instagram: [],
          facebook: [],
          linkedin: [],
          twitter: []
        }
      };
      
      // 1. 从主页提取
      const homepageContacts = await this.extractFromPage(website.url, '/');
      if (homepageContacts) {
        this.mergeContacts(allContacts, homepageContacts);
      }
      
      // 2. 从联系页面提取
      for (const pagePath of this.contactPages) {
        try {
          const pageContacts = await this.extractFromPage(website.url, pagePath);
          if (pageContacts) {
            this.mergeContacts(allContacts, pageContacts);
          }
          
          await this.delay(1000);
        } catch (error) {
          // 忽略单个页面错误
        }
      }

      // 3. 去重
      this.deduplicateContacts(allContacts);

      // 4. 保存到数据库
      const savedCount = await this.saveContacts(website.id, allContacts);

      const totalContacts = this.countTotalContacts(allContacts);
      console.log(`  ✅ Found ${totalContacts} contact methods (${savedCount} saved)`);
      
      return {
        website: website.url,
        contacts: allContacts,
        totalContacts,
        savedCount
      };

    } catch (error) {
      console.error(`❌ Error processing website ${website.url}:`, error.message);
      return {
        website: website.url,
        contacts: null,
        totalContacts: 0,
        savedCount: 0
      };
    }
  }

  // 18. 合并联系方式
  mergeContacts(target, source) {
    target.emails.push(...source.emails);
    target.whatsapp.push(...source.whatsapp);
    target.phones.push(...source.phones);
    target.telegram.push(...source.telegram);
    target.skype.push(...source.skype);
    
    Object.keys(target.social).forEach(platform => {
      target.social[platform].push(...source.social[platform]);
    });
  }

  // 19. 去重联系方式
  deduplicateContacts(contacts) {
    // 邮箱去重
    const emailSet = new Set();
    contacts.emails = contacts.emails.filter(email => {
      if (emailSet.has(email.value)) return false;
      emailSet.add(email.value);
      return true;
    });

    // WhatsApp去重
    const whatsappSet = new Set();
    contacts.whatsapp = contacts.whatsapp.filter(wa => {
      if (whatsappSet.has(wa.value)) return false;
      whatsappSet.add(wa.value);
      return true;
    });

    // 电话去重
    const phoneSet = new Set();
    contacts.phones = contacts.phones.filter(phone => {
      const normalized = phone.value.replace(/[^\d]/g, '');
      if (phoneSet.has(normalized)) return false;
      phoneSet.add(normalized);
      return true;
    });

    // 社交媒体去重
    Object.keys(contacts.social).forEach(platform => {
      const socialSet = new Set();
      contacts.social[platform] = contacts.social[platform].filter(social => {
        if (socialSet.has(social.value)) return false;
        socialSet.add(social.value);
        return true;
      });
    });
  }

  // 20. 统计总联系方式数量
  countTotalContacts(contacts) {
    let total = 0;
    total += contacts.emails.length;
    total += contacts.whatsapp.length;
    total += contacts.phones.length;
    total += contacts.telegram.length;
    total += contacts.skype.length;
    
    Object.values(contacts.social).forEach(arr => {
      total += arr.length;
    });
    
    return total;
  }

  // 21. 主提取流程
  async extract(limit = 50) {
    console.log('📞 Starting comprehensive contact extraction...\n');

    try {
      await this.connectDB();

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
        
        const result = await this.processWebsite(website);
        results.push(result);

        await this.delay(this.config.delay);
      }

      return results;

    } catch (error) {
      console.error('❌ Contact extraction failed:', error.message);
      throw error;
    } finally {
      if (this.db) {
        await this.db.end();
      }
    }
  }

  // 22. 生成详细报告
  async generateReport(results) {
    console.log('\n📊 Contact Extraction Report');
    console.log('============================');
    
    const totalWebsites = results.length;
    const successfulExtractions = results.filter(r => r.totalContacts > 0).length;
    const totalContacts = results.reduce((sum, r) => sum + r.totalContacts, 0);
    
    console.log(`Total websites processed: ${totalWebsites}`);
    console.log(`Websites with contacts found: ${successfulExtractions}`);
    console.log(`Total contact methods extracted: ${totalContacts}`);
    
    // 按联系方式类型统计
    const contactStats = {
      emails: 0,
      whatsapp: 0,
      phones: 0,
      telegram: 0,
      skype: 0,
      social: 0
    };

    results.forEach(result => {
      if (result.contacts) {
        contactStats.emails += result.contacts.emails.length;
        contactStats.whatsapp += result.contacts.whatsapp.length;
        contactStats.phones += result.contacts.phones.length;
        contactStats.telegram += result.contacts.telegram.length;
        contactStats.skype += result.contacts.skype.length;
        
        Object.values(result.contacts.social).forEach(arr => {
          contactStats.social += arr.length;
        });
      }
    });

    console.log('\n📞 Contact Methods Found:');
    console.log(`  📧 Emails: ${contactStats.emails}`);
    console.log(`  📱 WhatsApp: ${contactStats.whatsapp}`);
    console.log(`  ☎️  Phones: ${contactStats.phones}`);
    console.log(`  💬 Telegram: ${contactStats.telegram}`);
    console.log(`  🎤 Skype: ${contactStats.skype}`);
    console.log(`  🌐 Social Media: ${contactStats.social}`);

    // 显示高质量联系方式示例
    console.log('\n⭐ High-Value Contacts Found:');
    let exampleCount = 0;
    
    for (const result of results) {
      if (exampleCount >= 10) break;
      
      if (result.contacts && result.totalContacts > 2) {
        const domain = new URL(result.website).hostname;
        console.log(`\n  🏪 ${domain}:`);
        
        if (result.contacts.emails.length > 0) {
          console.log(`    📧 ${result.contacts.emails[0].value}`);
        }
        if (result.contacts.whatsapp.length > 0) {
          console.log(`    📱 ${result.contacts.whatsapp[0].value}`);
        }
        if (result.contacts.phones.length > 0) {
          console.log(`    ☎️  ${result.contacts.phones[0].value}`);
        }
        
        exampleCount++;
      }
    }

    console.log('\n📝 Next Steps:');
    console.log('  1. Review extracted contacts in database');
    console.log('  2. Prioritize WhatsApp and email contacts');
    console.log('  3. Create targeted outreach campaigns');
    console.log('  4. Use social media for additional research');
  }
}

// 主执行函数
async function main() {
  const extractor = new ContactExtractor();
  
  try {
    const results = await extractor.extract(50);
    
    console.log('\n🎉 Contact extraction completed!');
    
    if (results.length > 0) {
      await extractor.generateReport(results);
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

module.exports = ContactExtractor;









