#!/usr/bin/env node

/**
 * 增强版批量提取脚本
 * 重点关注About Us页面和其他联系页面的详细信息
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class EnhancedExtractor {
  constructor() {
    this.results = [];
    this.processed = 0;
    this.config = {
      delay: 4000, // 增加到4秒延迟
      timeout: 20000, // 增加超时时间
      maxSites: 20, // 减少网站数量但提高质量
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
  }

  // 高质量的Shopify网站列表
  getQualityShopifySites() {
    return [
      'https://www.gymshark.com',
      'https://www.allbirds.eu',
      'https://www.bombas.com',
      'https://www.glossier.com',
      'https://www.casper.com',
      'https://www.fashionnova.com',
      'https://www.outdoor-voices.com',
      'https://www.rothy.com',
      'https://www.away.com',
      'https://www.warby-parker.com',
      'https://www.everlane.com',
      'https://www.brooklinen.com',
      'https://www.patagonia.com',
      'https://www.lululemon.com',
      'https://www.adidas.com',
      'https://www.nike.com',
      'https://www.underarmour.com',
      'https://www.reebok.com',
      'https://www.puma.com',
      'https://www.newbalance.com'
    ];
  }

  // 安全HTTP请求
  async safeRequest(url, options = {}) {
    try {
      const response = await axios.get(url, {
        timeout: this.config.timeout,
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
          'Accept-Encoding': 'gzip, deflate',
          ...options.headers
        },
        maxRedirects: 5,
        ...options
      });
      return response;
    } catch (error) {
      console.log(`      ❌ 请求失败: ${error.message}`);
      return null;
    }
  }

  // 检测Shopify网站
  isShopifyStore(html) {
    const htmlLower = html.toLowerCase();
    const shopifyIndicators = [
      'shopify',
      'cdn.shopify.com',
      'shopify-section',
      'shopify.theme',
      'shopify-features',
      'shopify.routes',
      'shopify.money',
      '/wpm@',
      'shopify-features'
    ];

    const foundIndicators = shopifyIndicators.filter(indicator => 
      htmlLower.includes(indicator)
    );

    return {
      isShopify: foundIndicators.length > 0,
      indicators: foundIndicators
    };
  }

  // 增强的联系页面列表
  getContactPages() {
    return [
      // About页面 (最重要)
      '/about', '/about-us', '/about-gymshark', '/pages/about-us', '/pages/about',
      
      // Contact页面
      '/contact', '/contact-us', '/get-in-touch', '/pages/contact', '/pages/contact-us',
      
      // Support页面
      '/support', '/help', '/customer-service', '/customer-support', '/pages/support',
      
      // Business页面
      '/business', '/corporate', '/wholesale', '/b2b', '/partnership', '/pages/business',
      
      // Press页面
      '/press', '/media', '/news', '/press-releases', '/pages/press',
      
      // Legal页面 (欧洲网站常有)
      '/impressum', '/legal', '/imprint', '/pages/legal', '/pages/impressum',
      
      // Careers页面 (有时有HR邮箱)
      '/careers', '/jobs', '/work-with-us', '/pages/careers'
    ];
  }

  // 增强的邮箱提取
  extractEmails(content, sourceUrl = '') {
    const emails = new Set();
    
    // 1. 基本邮箱正则
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = content.match(emailRegex) || [];
    
    emailMatches.forEach(email => {
      email = email.toLowerCase().trim();
      if (this.isValidBusinessEmail(email)) {
        emails.add(email);
      }
    });

    // 2. 特殊格式的邮箱提取
    const $ = cheerio.load(content);
    
    // mailto链接
    $('a[href^="mailto:"]').each((i, el) => {
      const href = $(el).attr('href');
      const email = href.replace('mailto:', '').split('?')[0].toLowerCase().trim();
      if (this.isValidBusinessEmail(email)) {
        emails.add(email);
      }
    });

    // 3. 特定文本模式 (如 "email: xxx@xxx.com" 或 "please email: xxx")
    const textPatterns = [
      /email[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      /contact[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      /reach\s+(?:us\s+)?(?:at\s+)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      /write\s+(?:to\s+)?(?:us\s+)?(?:at\s+)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
    ];

    textPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const email = match[1].toLowerCase().trim();
        if (this.isValidBusinessEmail(email)) {
          emails.add(email);
        }
      }
    });

    return Array.from(emails).map(email => ({
      email,
      source: sourceUrl,
      type: this.categorizeEmail(email)
    }));
  }

  // 邮箱分类
  categorizeEmail(email) {
    const prefix = email.split('@')[0].toLowerCase();
    
    const categories = {
      'info': ['info', 'information'],
      'contact': ['contact', 'hello', 'hi'],
      'support': ['support', 'help', 'service', 'customer'],
      'sales': ['sales', 'business', 'commercial', 'b2b'],
      'press': ['press', 'media', 'pr', 'news'],
      'corporate': ['corporate', 'admin', 'office'],
      'hr': ['hr', 'careers', 'jobs', 'recruitment'],
      'partnerships': ['partnership', 'partners', 'collaborate', 'wholesale']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => prefix.includes(keyword))) {
        return category;
      }
    }

    return 'other';
  }

  // 验证商务邮箱
  isValidBusinessEmail(email) {
    if (!email || !email.includes('@') || email.length < 5) return false;
    
    const junkPatterns = [
      'noreply', 'no-reply', 'donotreply', 'example.com', 'test@', 
      'admin@localhost', 'user@domain', 'privacy', 'whoisguard', 
      'domainprivacy', 'wordpress', 'notifications@', 'bounce@',
      'mailer-daemon', 'postmaster', 'webmaster@localhost'
    ];
    
    return !junkPatterns.some(pattern => email.includes(pattern));
  }

  // 提取其他联系方式
  extractOtherContacts(content, sourceUrl = '') {
    const contacts = {
      whatsapp: new Set(),
      phones: new Set(),
      social: {
        instagram: new Set(),
        facebook: new Set(),
        linkedin: new Set(),
        twitter: new Set(),
        tiktok: new Set()
      }
    };

    // WhatsApp
    const whatsappPatterns = [
      /whatsapp[:\s]*\+?[\d\s\-\(\)]{10,20}/gi,
      /wa\.me\/[\+\d]{10,20}/gi,
      /api\.whatsapp\.com\/send\?phone=[\+\d]{10,20}/gi
    ];
    
    whatsappPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => contacts.whatsapp.add(match.trim()));
    });

    // 电话号码
    const phonePatterns = [
      /\+[\d\s\-\(\)]{10,20}/g,
      /\b[\d]{3}[\s\-\.][\d]{3}[\s\-\.][\d]{4}\b/g,
      /\([\d]{3}\)[\s\-][\d]{3}[\s\-][\d]{4}/g,
      /[\d]{3}[\s\-][\d]{4}[\s\-][\d]{4}/g
    ];
    
    phonePatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => {
        const cleaned = match.replace(/[^\d+\-\s\(\)\.]/g, '').trim();
        if (cleaned.length >= 10) {
          contacts.phones.add(cleaned);
        }
      });
    });

    // 社交媒体
    const $ = cheerio.load(content);
    const socialPlatforms = {
      instagram: ['instagram.com'],
      facebook: ['facebook.com', 'fb.com'],
      linkedin: ['linkedin.com'],
      twitter: ['twitter.com', 'x.com'],
      tiktok: ['tiktok.com']
    };

    Object.keys(socialPlatforms).forEach(platform => {
      socialPlatforms[platform].forEach(domain => {
        $(`a[href*="${domain}"]`).each((i, el) => {
          const href = $(el).attr('href') || '';
          if (href && !href.includes('sharer') && !href.includes('intent')) {
            contacts.social[platform].add(href);
          }
        });
      });
    });

    // 转换为数组
    const result = {
      whatsapp: Array.from(contacts.whatsapp),
      phones: Array.from(contacts.phones),
      social: {}
    };

    Object.keys(contacts.social).forEach(platform => {
      result.social[platform] = Array.from(contacts.social[platform]);
    });

    return result;
  }

  // 深度提取联系页面信息
  async deepExtractFromPages(baseUrl) {
    console.log(`📄 深度提取联系页面信息...`);
    
    const allContacts = {
      emails: [],
      whatsapp: [],
      phones: [],
      social: { instagram: [], facebook: [], linkedin: [], twitter: [], tiktok: [] }
    };

    const contactPages = this.getContactPages();
    let foundPages = 0;

    for (const page of contactPages) {
      try {
        const fullUrl = new URL(page, baseUrl).href;
        console.log(`      🔍 检查: ${page}`);
        
        const response = await this.safeRequest(fullUrl);
        
        if (response && response.status === 200) {
          foundPages++;
          console.log(`      ✅ 找到页面: ${page}`);
          
          // 提取邮箱
          const emails = this.extractEmails(response.data, fullUrl);
          allContacts.emails.push(...emails);
          
          // 提取其他联系方式
          const otherContacts = this.extractOtherContacts(response.data, fullUrl);
          allContacts.whatsapp.push(...otherContacts.whatsapp);
          allContacts.phones.push(...otherContacts.phones);
          
          Object.keys(otherContacts.social).forEach(platform => {
            allContacts.social[platform].push(...otherContacts.social[platform]);
          });

          console.log(`      📧 本页找到: ${emails.length} 邮箱, ${otherContacts.whatsapp.length} WhatsApp, ${otherContacts.phones.length} 电话`);
          
          // 如果是About页面，特别标注
          if (page.includes('about')) {
            console.log(`      ⭐ About页面 - 重要信息源`);
          }

          await new Promise(resolve => setTimeout(resolve, 1000)); // 页面间延迟
        }
      } catch (error) {
        // 忽略单个页面错误
      }
    }

    console.log(`      📊 总计访问了 ${foundPages} 个有效页面`);

    // 去重
    const uniqueContacts = {
      emails: this.deduplicateEmails(allContacts.emails),
      whatsapp: [...new Set(allContacts.whatsapp)],
      phones: [...new Set(allContacts.phones)],
      social: {}
    };

    Object.keys(allContacts.social).forEach(platform => {
      uniqueContacts.social[platform] = [...new Set(allContacts.social[platform])];
    });

    return uniqueContacts;
  }

  // 邮箱去重（保留类型信息）
  deduplicateEmails(emails) {
    const emailMap = new Map();
    
    emails.forEach(emailObj => {
      const email = emailObj.email;
      if (!emailMap.has(email)) {
        emailMap.set(email, emailObj);
      } else {
        // 如果已存在，保留更好的类型
        const existing = emailMap.get(email);
        if (emailObj.type !== 'other' && existing.type === 'other') {
          emailMap.set(email, emailObj);
        }
      }
    });

    return Array.from(emailMap.values());
  }

  // 处理单个网站
  async processSite(url) {
    this.processed++;
    console.log(`\n[${this.processed}] 🎯 深度分析: ${url}`);
    console.log('='.repeat(70));

    try {
      // 1. 获取主页
      console.log(`🏠 访问主页...`);
      const response = await this.safeRequest(url);
      if (!response) {
        console.log('❌ 主页无法访问');
        return null;
      }

      const html = response.data;
      const $ = cheerio.load(html);
      const domain = new URL(url).hostname;
      const title = $('title').text().trim() || '无标题';

      console.log(`✅ 主页访问成功 (${response.status})`);
      console.log(`📋 网站标题: ${title.substring(0, 80)}${title.length > 80 ? '...' : ''}`);
      console.log(`🗺️  域名: ${domain}`);

      // 2. 检测Shopify
      const shopifyCheck = this.isShopifyStore(html);
      console.log(`🛍️  Shopify检测: ${shopifyCheck.isShopify ? '✅ 确认' : '❌ 不是'}`);
      if (shopifyCheck.isShopify) {
        console.log(`   🔍 发现特征: ${shopifyCheck.indicators.slice(0, 3).join(', ')}${shopifyCheck.indicators.length > 3 ? '...' : ''}`);
      }

      if (!shopifyCheck.isShopify) {
        console.log('⏭️  跳过: 非Shopify网站');
        return null;
      }

      // 3. 主页联系方式提取
      console.log(`📞 主页联系方式提取...`);
      const homeEmails = this.extractEmails(html, url);
      const homeOthers = this.extractOtherContacts(html, url);
      
      console.log(`   📧 主页邮箱: ${homeEmails.length}个`);
      homeEmails.forEach(emailObj => {
        console.log(`      ✉️  ${emailObj.email} (${emailObj.type})`);
      });

      // 4. 深度页面提取
      const deepContacts = await this.deepExtractFromPages(url);

      // 5. 合并所有联系方式
      const allEmails = [...homeEmails, ...deepContacts.emails];
      const finalEmails = this.deduplicateEmails(allEmails);

      const finalContacts = {
        emails: finalEmails,
        whatsapp: [...new Set([...homeOthers.whatsapp, ...deepContacts.whatsapp])],
        phones: [...new Set([...homeOthers.phones, ...deepContacts.phones])],
        social: {}
      };

      Object.keys(homeOthers.social).forEach(platform => {
        finalContacts.social[platform] = [
          ...new Set([
            ...homeOthers.social[platform],
            ...deepContacts.social[platform]
          ])
        ];
      });

      // 6. 统计和展示结果
      const totalContacts = finalContacts.emails.length + 
                           finalContacts.whatsapp.length + 
                           finalContacts.phones.length +
                           Object.values(finalContacts.social).reduce((sum, arr) => sum + arr.length, 0);

      console.log(`\n📊 最终联系方式统计:`);
      console.log(`   📧 邮箱: ${finalContacts.emails.length}个`);
      console.log(`   📱 WhatsApp: ${finalContacts.whatsapp.length}个`);
      console.log(`   ☎️  电话: ${finalContacts.phones.length}个`);
      console.log(`   🌐 社交媒体: ${Object.values(finalContacts.social).reduce((sum, arr) => sum + arr.length, 0)}个`);
      console.log(`   🎯 总计: ${totalContacts}个`);

      // 详细显示邮箱
      if (finalContacts.emails.length > 0) {
        console.log(`\n📧 详细邮箱列表:`);
        finalContacts.emails.forEach((emailObj, index) => {
          console.log(`   ${index + 1}. ${emailObj.email}`);
          console.log(`      📂 类型: ${emailObj.type}`);
          console.log(`      📍 来源: ${emailObj.source.replace(url, '').substring(0, 30)}`);
        });
      }

      // 构建结果对象
      const result = {
        url,
        domain,
        title: title.substring(0, 200),
        isShopify: true,
        shopifyIndicators: shopifyCheck.indicators,
        contacts: finalContacts,
        totalContacts,
        processedAt: new Date().toISOString(),
        status: 'success'
      };

      console.log(`\n🎉 分析完成 - 发现 ${totalContacts} 个联系方式`);
      return result;

    } catch (error) {
      console.log(`❌ 处理失败: ${error.message}`);
      return null;
    }
  }

  // 批量处理
  async batchProcess() {
    console.log('🚀 开始增强版批量处理...\n');
    console.log(`📋 目标: ${this.config.maxSites} 个高质量Shopify网站`);
    console.log(`⏱️  延迟: ${this.config.delay/1000}秒/网站`);
    console.log(`🕐 预计: ${Math.round(this.config.maxSites * this.config.delay / 1000 / 60)} 分钟\n`);

    const sites = this.getQualityShopifySites().slice(0, this.config.maxSites);
    
    for (const site of sites) {
      const result = await this.processSite(site);
      
      if (result) {
        this.results.push(result);
      }

      console.log(`\n⏳ 等待 ${this.config.delay/1000} 秒后继续...\n`);
      await new Promise(resolve => setTimeout(resolve, this.config.delay));
    }

    return this.results;
  }

  // 保存增强结果
  async saveEnhancedResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsDir = path.join(__dirname, 'results');
    
    await fs.mkdir(resultsDir, { recursive: true });

    // 1. 详细JSON报告
    const jsonFile = path.join(resultsDir, `enhanced-contacts-${timestamp}.json`);
    const report = {
      generatedAt: new Date().toISOString(),
      version: 'enhanced-v2.0',
      summary: {
        totalProcessed: this.processed,
        totalShopifyFound: this.results.length,
        successRate: `${((this.results.length / this.processed) * 100).toFixed(1)}%`,
        totalContacts: this.results.reduce((sum, r) => sum + r.totalContacts, 0),
        emailBreakdown: this.getEmailBreakdown(),
        topDomains: this.getTopDomains()
      },
      sites: this.results
    };

    await fs.writeFile(jsonFile, JSON.stringify(report, null, 2));
    console.log(`💾 详细报告: ${path.basename(jsonFile)}`);

    // 2. 商务邮箱专用CSV
    const csvFile = path.join(resultsDir, `business-emails-${timestamp}.csv`);
    let csvContent = 'Website,Domain,Title,Email,Type,Source Page,Phone,WhatsApp,Instagram,LinkedIn\n';

    this.results.forEach(site => {
      site.contacts.emails.forEach(emailObj => {
        const phone = site.contacts.phones[0] || '';
        const whatsapp = site.contacts.whatsapp[0] || '';
        const instagram = site.contacts.social.instagram[0] || '';
        const linkedin = site.contacts.social.linkedin[0] || '';
        const sourcePage = emailObj.source.replace(site.url, '') || '/';
        
        csvContent += `"${site.url}","${site.domain}","${site.title}","${emailObj.email}","${emailObj.type}","${sourcePage}","${phone}","${whatsapp}","${instagram}","${linkedin}"\n`;
      });
    });

    await fs.writeFile(csvFile, csvContent);
    console.log(`📊 商务邮箱CSV: ${path.basename(csvFile)}`);

    // 3. 推广用简化报告
    const txtFile = path.join(resultsDir, `promotion-ready-${timestamp}.txt`);
    let txtContent = `欧洲Shopify网站商务联系方式 - 推广专用\n`;
    txtContent += `生成时间: ${new Date().toLocaleString()}\n`;
    txtContent += `网站数量: ${this.results.length}\n`;
    txtContent += `总邮箱数: ${this.results.reduce((sum, r) => sum + r.contacts.emails.length, 0)}\n\n`;

    txtContent += `=== 高质量商务联系方式 ===\n\n`;
    
    this.results.forEach((site, index) => {
      if (site.contacts.emails.length > 0) {
        txtContent += `${index + 1}. ${site.domain}\n`;
        txtContent += `   🌐 ${site.url}\n`;
        txtContent += `   📧 邮箱联系:\n`;
        
        site.contacts.emails.forEach(emailObj => {
          txtContent += `      • ${emailObj.email} (${emailObj.type})\n`;
        });
        
        if (site.contacts.phones.length > 0) {
          txtContent += `   ☎️  电话: ${site.contacts.phones[0]}\n`;
        }
        
        txtContent += '\n';
      }
    });

    await fs.writeFile(txtFile, txtContent);
    console.log(`📝 推广报告: ${path.basename(txtFile)}`);

    return { jsonFile, csvFile, txtFile };
  }

  // 获取邮箱类型统计
  getEmailBreakdown() {
    const breakdown = {};
    this.results.forEach(site => {
      site.contacts.emails.forEach(emailObj => {
        breakdown[emailObj.type] = (breakdown[emailObj.type] || 0) + 1;
      });
    });
    return breakdown;
  }

  // 获取热门域名
  getTopDomains() {
    const domains = {};
    this.results.forEach(site => {
      domains[site.domain] = site.contacts.emails.length;
    });
    
    return Object.entries(domains)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [domain, count]) => {
        obj[domain] = count;
        return obj;
      }, {});
  }
}

// 主函数
async function main() {
  const extractor = new EnhancedExtractor();
  
  try {
    console.log('🎯 启动增强版欧洲Shopify联系方式提取系统...\n');
    
    const results = await extractor.batchProcess();
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 增强版处理完成!');
    console.log(`\n📈 最终成果:`);
    console.log(`   🎯 处理网站: ${extractor.processed} 个`);
    console.log(`   ✅ 发现Shopify: ${results.length} 个`);
    console.log(`   📧 总邮箱数: ${results.reduce((sum, r) => sum + r.contacts.emails.length, 0)} 个`);
    console.log(`   📞 总联系方式: ${results.reduce((sum, r) => sum + r.totalContacts, 0)} 个`);
    
    if (results.length > 0) {
      // 显示邮箱类型分布
      const emailTypes = extractor.getEmailBreakdown();
      console.log(`\n📊 邮箱类型分布:`);
      Object.entries(emailTypes).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} 个`);
      });
      
      console.log('\n💾 生成结果文件...');
      const files = await extractor.saveEnhancedResults();
      
      console.log('\n🎊 任务完成！可用于推广的文件：');
      console.log(`   📄 ${path.basename(files.jsonFile)}`);
      console.log(`   📊 ${path.basename(files.csvFile)}`);
      console.log(`   📝 ${path.basename(files.txtFile)}`);
      
      console.log('\n🚀 推广建议:');
      console.log('   1. 优先联系有 corporate/business 邮箱的网站');
      console.log('   2. 准备英语、德语、法语的推广邮件');
      console.log('   3. 强调代发货服务的成本优势和速度');
    } else {
      console.log('\n⚠️  未发现有效的Shopify网站');
    }
    
  } catch (error) {
    console.error('❌ 系统错误:', error.message);
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = EnhancedExtractor;









