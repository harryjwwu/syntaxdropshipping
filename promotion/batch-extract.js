#!/usr/bin/env node

/**
 * 批量发现欧洲Shopify网站并提取详细联系方式
 * 结果直接保存到JSON和CSV文件
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class BatchExtractor {
  constructor() {
    this.results = [];
    this.processed = 0;
    this.config = {
      delay: 3000, // 3秒延迟
      timeout: 15000,
      maxSites: 50, // 最多处理50个网站
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
  }

  // 已知的欧洲Shopify网站和相关网站
  getTestSites() {
    return [
      // 已知Shopify网站
      'https://www.gymshark.com',
      'https://www.allbirds.eu',
      'https://www.bombas.com',
      'https://www.away.com',
      'https://www.glossier.com',
      'https://www.casper.com',
      'https://www.warby-parker.com',
      'https://www.outdoor-voices.com',
      'https://www.rothy.com',
      'https://www.everlane.com',
      
      // 欧洲域名网站（可能是Shopify）
      'https://www.na-kd.com',
      'https://www.aboutyou.de',
      'https://shop.mango.com',
      'https://www.zalando-lounge.de',
      'https://www.boozt.com',
      'https://www.farfetch.com',
      'https://www.net-a-porter.com',
      'https://www.matchesfashion.com',
      'https://www.selfridges.com',
      'https://www.harrods.com',
      
      // 更多潜在网站
      'https://www.asos.com',
      'https://www.boohoo.com',
      'https://www.prettylittlething.com',
      'https://www.misguided.com',
      'https://www.fashionnova.com',
      'https://www.revolve.com',
      'https://www.ssense.com',
      'https://www.endclothing.com',
      'https://www.mrporter.com',
      'https://www.luisaviaroma.com'
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
          ...options.headers
        },
        maxRedirects: 3,
        ...options
      });
      return response;
    } catch (error) {
      return null;
    }
  }

  // 检测是否为Shopify网站
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
      '/wpm@'
    ];

    const foundIndicators = shopifyIndicators.filter(indicator => 
      htmlLower.includes(indicator)
    );

    return {
      isShopify: foundIndicators.length > 0,
      indicators: foundIndicators
    };
  }

  // 检测是否为欧洲相关网站
  isEuropeanSite(url, html) {
    const domain = new URL(url).hostname;
    const htmlLower = html.toLowerCase();
    
    // 域名检测
    const europeanTlds = ['.eu', '.de', '.fr', '.it', '.es', '.nl', '.co.uk', '.be', '.at', '.ch', '.se', '.dk', '.no'];
    const hasTld = europeanTlds.some(tld => domain.endsWith(tld));
    
    // 内容检测
    const europeanKeywords = [
      'europe', 'european', 'deutschland', 'germany', 'france', 'italia', 'italy', 
      'spain', 'españa', 'netherlands', 'nederland', 'united kingdom', 'uk',
      'belgium', 'austria', 'switzerland', 'sweden', 'denmark', 'norway',
      '€', 'eur', '£', 'gbp', 'chf', 'sek', 'dkk', 'nok'
    ];
    const hasKeywords = europeanKeywords.some(keyword => htmlLower.includes(keyword));
    
    return hasTld || hasKeywords;
  }

  // 提取联系方式
  extractContacts(url, html) {
    const $ = cheerio.load(html);
    const contacts = {
      emails: new Set(),
      whatsapp: new Set(),
      phones: new Set(),
      social: {
        instagram: new Set(),
        facebook: new Set(),
        linkedin: new Set(),
        twitter: new Set(),
        tiktok: new Set()
      },
      other: new Set()
    };

    // 1. 提取邮箱
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = html.match(emailRegex) || [];
    
    emailMatches.forEach(email => {
      email = email.toLowerCase().trim();
      if (this.isValidBusinessEmail(email)) {
        contacts.emails.add(email);
      }
    });

    // 2. mailto链接
    $('a[href^="mailto:"]').each((i, el) => {
      const href = $(el).attr('href');
      const email = href.replace('mailto:', '').split('?')[0].toLowerCase().trim();
      if (this.isValidBusinessEmail(email)) {
        contacts.emails.add(email);
      }
    });

    // 3. WhatsApp
    const whatsappPatterns = [
      /whatsapp[:\s]*\+?[\d\s\-\(\)]{10,20}/gi,
      /wa\.me\/[\+\d]{10,20}/gi,
      /api\.whatsapp\.com\/send\?phone=[\+\d]{10,20}/gi
    ];
    
    whatsappPatterns.forEach(pattern => {
      const matches = html.match(pattern) || [];
      matches.forEach(match => {
        contacts.whatsapp.add(match.trim());
      });
    });

    $('a[href*="whatsapp"], a[href*="wa.me"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href) {
        contacts.whatsapp.add(href);
      }
    });

    // 4. 电话号码
    const phonePatterns = [
      /\+[\d\s\-\(\)]{10,20}/g,
      /\b[\d]{3}[\s\-\.][\d]{3}[\s\-\.][\d]{4}\b/g,
      /\([\d]{3}\)[\s\-][\d]{3}[\s\-][\d]{4}/g
    ];
    
    phonePatterns.forEach(pattern => {
      const matches = html.match(pattern) || [];
      matches.forEach(match => {
        const cleaned = match.replace(/[^\d+\-\s\(\)\.]/g, '').trim();
        if (cleaned.length >= 10) {
          contacts.phones.add(cleaned);
        }
      });
    });

    $('a[href^="tel:"]').each((i, el) => {
      const href = $(el).attr('href');
      const phone = href.replace('tel:', '').trim();
      if (phone.length >= 7) {
        contacts.phones.add(phone);
      }
    });

    // 5. 社交媒体
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
          if (href && !href.includes('sharer') && !href.includes('intent') && !href.includes('button')) {
            contacts.social[platform].add(href);
          }
        });
      });
    });

    // 转换Set为Array
    const result = {
      emails: Array.from(contacts.emails),
      whatsapp: Array.from(contacts.whatsapp),
      phones: Array.from(contacts.phones),
      social: {},
      other: Array.from(contacts.other)
    };

    Object.keys(contacts.social).forEach(platform => {
      result.social[platform] = Array.from(contacts.social[platform]);
    });

    return result;
  }

  // 验证商务邮箱
  isValidBusinessEmail(email) {
    if (!email || !email.includes('@')) return false;
    
    const junkPatterns = [
      'noreply', 'no-reply', 'donotreply', 'example.com', 'test@', 
      'admin@localhost', 'user@domain', 'privacy', 'whoisguard', 
      'domainprivacy', 'wordpress', 'notifications@'
    ];
    
    return !junkPatterns.some(pattern => email.includes(pattern));
  }

  // 访问联系页面获取更多信息
  async extractFromContactPages(baseUrl) {
    const contactPages = [
      '/contact', '/contact-us', '/about', '/about-us', 
      '/support', '/help', '/customer-service', '/impressum'
    ];
    
    const allContacts = {
      emails: new Set(),
      whatsapp: new Set(),
      phones: new Set(),
      social: { instagram: new Set(), facebook: new Set(), linkedin: new Set(), twitter: new Set(), tiktok: new Set() },
      other: new Set()
    };

    for (const page of contactPages) {
      try {
        const contactUrl = new URL(page, baseUrl).href;
        const response = await this.safeRequest(contactUrl);
        
        if (response && response.status === 200) {
          const contacts = this.extractContacts(contactUrl, response.data);
          
          // 合并结果
          contacts.emails.forEach(email => allContacts.emails.add(email));
          contacts.whatsapp.forEach(wa => allContacts.whatsapp.add(wa));
          contacts.phones.forEach(phone => allContacts.phones.add(phone));
          contacts.other.forEach(other => allContacts.other.add(other));
          
          Object.keys(contacts.social).forEach(platform => {
            contacts.social[platform].forEach(link => 
              allContacts.social[platform].add(link)
            );
          });
          
          console.log(`      📄 ${page}: 找到 ${contacts.emails.length + contacts.whatsapp.length + contacts.phones.length} 个联系方式`);
          break; // 找到一个有效页面就够了
        }
      } catch (error) {
        // 忽略单个页面错误
      }
    }

    // 转换为最终格式
    const result = {
      emails: Array.from(allContacts.emails),
      whatsapp: Array.from(allContacts.whatsapp),
      phones: Array.from(allContacts.phones),
      social: {},
      other: Array.from(allContacts.other)
    };

    Object.keys(allContacts.social).forEach(platform => {
      result.social[platform] = Array.from(allContacts.social[platform]);
    });

    return result;
  }

  // 处理单个网站
  async processSite(url) {
    this.processed++;
    console.log(`\n[${this.processed}] 🔍 处理: ${url}`);
    console.log('='.repeat(60));

    try {
      // 1. 获取主页
      const response = await this.safeRequest(url);
      if (!response) {
        console.log('❌ 无法访问网站');
        return null;
      }

      const html = response.data;
      const $ = cheerio.load(html);
      const domain = new URL(url).hostname;
      const title = $('title').text().trim() || '无标题';

      console.log(`✅ 成功访问 (${response.status})`);
      console.log(`📋 标题: ${title}`);
      console.log(`🗺️  域名: ${domain}`);

      // 2. 检测Shopify
      const shopifyCheck = this.isShopifyStore(html);
      console.log(`🛍️  Shopify: ${shopifyCheck.isShopify ? '✅' : '❌'}`);
      if (shopifyCheck.isShopify) {
        console.log(`   特征: ${shopifyCheck.indicators.join(', ')}`);
      }

      // 3. 检测欧洲相关
      const isEuropean = this.isEuropeanSite(url, html);
      console.log(`🌍 欧洲相关: ${isEuropean ? '✅' : '❌'}`);

      // 如果不是Shopify网站，跳过
      if (!shopifyCheck.isShopify) {
        console.log('⏭️  跳过：不是Shopify网站');
        return null;
      }

      // 4. 提取主页联系方式
      console.log('📞 提取联系方式...');
      const homeContacts = this.extractContacts(url, html);
      
      // 5. 从联系页面提取更多信息
      const contactPageContacts = await this.extractFromContactPages(url);
      
      // 6. 合并所有联系方式
      const allContacts = this.mergeContacts(homeContacts, contactPageContacts);
      
      // 7. 统计结果
      const totalContacts = allContacts.emails.length + 
                           allContacts.whatsapp.length + 
                           allContacts.phones.length +
                           Object.values(allContacts.social).reduce((sum, arr) => sum + arr.length, 0);

      console.log(`📊 联系方式统计:`);
      console.log(`   📧 邮箱: ${allContacts.emails.length}个`);
      console.log(`   📱 WhatsApp: ${allContacts.whatsapp.length}个`);
      console.log(`   ☎️  电话: ${allContacts.phones.length}个`);
      console.log(`   🌐 社交媒体: ${Object.values(allContacts.social).reduce((sum, arr) => sum + arr.length, 0)}个`);
      console.log(`   🎯 总计: ${totalContacts}个`);

      // 显示具体联系方式
      if (allContacts.emails.length > 0) {
        console.log(`📧 邮箱详情:`);
        allContacts.emails.slice(0, 3).forEach(email => {
          console.log(`   ✉️  ${email}`);
        });
      }

      if (allContacts.whatsapp.length > 0) {
        console.log(`📱 WhatsApp:`);
        allContacts.whatsapp.slice(0, 2).forEach(wa => {
          console.log(`   💬 ${wa}`);
        });
      }

      if (allContacts.phones.length > 0) {
        console.log(`☎️  电话:`);
        allContacts.phones.slice(0, 2).forEach(phone => {
          console.log(`   📞 ${phone}`);
        });
      }

      // 8. 构建结果对象
      const result = {
        url,
        domain,
        title: title.substring(0, 200),
        isShopify: shopifyCheck.isShopify,
        shopifyIndicators: shopifyCheck.indicators,
        isEuropean,
        contacts: allContacts,
        totalContacts,
        processedAt: new Date().toISOString(),
        status: 'success'
      };

      console.log(`✅ 处理完成 - 找到${totalContacts}个联系方式`);
      return result;

    } catch (error) {
      console.log(`❌ 处理失败: ${error.message}`);
      return {
        url,
        domain: new URL(url).hostname,
        title: '',
        isShopify: false,
        isEuropean: false,
        contacts: { emails: [], whatsapp: [], phones: [], social: {}, other: [] },
        totalContacts: 0,
        processedAt: new Date().toISOString(),
        status: 'error',
        error: error.message
      };
    }
  }

  // 合并联系方式
  mergeContacts(contacts1, contacts2) {
    const merged = {
      emails: [...new Set([...contacts1.emails, ...contacts2.emails])],
      whatsapp: [...new Set([...contacts1.whatsapp, ...contacts2.whatsapp])],
      phones: [...new Set([...contacts1.phones, ...contacts2.phones])],
      social: {},
      other: [...new Set([...contacts1.other, ...contacts2.other])]
    };

    // 合并社交媒体
    const allPlatforms = new Set([
      ...Object.keys(contacts1.social),
      ...Object.keys(contacts2.social)
    ]);

    allPlatforms.forEach(platform => {
      const links1 = contacts1.social[platform] || [];
      const links2 = contacts2.social[platform] || [];
      merged.social[platform] = [...new Set([...links1, ...links2])];
    });

    return merged;
  }

  // 批量处理
  async batchProcess() {
    console.log('🚀 开始批量处理欧洲Shopify网站...\n');
    console.log(`📋 计划处理: ${this.config.maxSites} 个网站`);
    console.log(`⏱️  延迟设置: ${this.config.delay}ms`);
    console.log(`🕐 预计用时: ${Math.round(this.config.maxSites * this.config.delay / 1000 / 60)} 分钟\n`);

    const sites = this.getTestSites().slice(0, this.config.maxSites);
    
    for (const site of sites) {
      const result = await this.processSite(site);
      
      if (result && result.isShopify) {
        this.results.push(result);
      }

      // 延迟
      console.log(`⏳ 等待 ${this.config.delay/1000} 秒...\n`);
      await new Promise(resolve => setTimeout(resolve, this.config.delay));
    }

    return this.results;
  }

  // 保存结果到文件
  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsDir = path.join(__dirname, 'results');
    
    // 确保results目录存在
    await fs.mkdir(resultsDir, { recursive: true });

    // 1. 保存完整JSON结果
    const jsonFile = path.join(resultsDir, `shopify-contacts-${timestamp}.json`);
    const fullReport = {
      generatedAt: new Date().toISOString(),
      totalProcessed: this.processed,
      totalShopifyFound: this.results.length,
      successRate: `${((this.results.length / this.processed) * 100).toFixed(1)}%`,
      summary: {
        totalSites: this.results.length,
        withEmails: this.results.filter(r => r.contacts.emails.length > 0).length,
        withWhatsApp: this.results.filter(r => r.contacts.whatsapp.length > 0).length,
        withPhones: this.results.filter(r => r.contacts.phones.length > 0).length,
        totalContacts: this.results.reduce((sum, r) => sum + r.totalContacts, 0)
      },
      sites: this.results
    };

    await fs.writeFile(jsonFile, JSON.stringify(fullReport, null, 2));
    console.log(`💾 完整结果已保存: ${jsonFile}`);

    // 2. 保存简化的联系方式CSV
    const csvFile = path.join(resultsDir, `contacts-${timestamp}.csv`);
    const csvHeaders = 'URL,Domain,Title,Emails,WhatsApp,Phones,Instagram,Facebook,LinkedIn,Total Contacts\n';
    let csvContent = csvHeaders;

    this.results.forEach(site => {
      const emails = site.contacts.emails.join('; ');
      const whatsapp = site.contacts.whatsapp.join('; ');
      const phones = site.contacts.phones.join('; ');
      const instagram = site.contacts.social.instagram?.join('; ') || '';
      const facebook = site.contacts.social.facebook?.join('; ') || '';
      const linkedin = site.contacts.social.linkedin?.join('; ') || '';
      
      csvContent += `"${site.url}","${site.domain}","${site.title}","${emails}","${whatsapp}","${phones}","${instagram}","${facebook}","${linkedin}",${site.totalContacts}\n`;
    });

    await fs.writeFile(csvFile, csvContent);
    console.log(`📊 CSV文件已保存: ${csvFile}`);

    // 3. 生成简单的文本报告
    const txtFile = path.join(resultsDir, `report-${timestamp}.txt`);
    let txtContent = `欧洲Shopify网站联系方式提取报告\n`;
    txtContent += `生成时间: ${new Date().toLocaleString()}\n`;
    txtContent += `处理网站数: ${this.processed}\n`;
    txtContent += `发现Shopify网站: ${this.results.length}\n`;
    txtContent += `成功率: ${((this.results.length / this.processed) * 100).toFixed(1)}%\n\n`;

    txtContent += `=== 详细结果 ===\n\n`;
    
    this.results.forEach((site, index) => {
      txtContent += `${index + 1}. ${site.domain}\n`;
      txtContent += `   网址: ${site.url}\n`;
      txtContent += `   标题: ${site.title}\n`;
      txtContent += `   联系方式总数: ${site.totalContacts}\n`;
      
      if (site.contacts.emails.length > 0) {
        txtContent += `   📧 邮箱: ${site.contacts.emails.join(', ')}\n`;
      }
      if (site.contacts.whatsapp.length > 0) {
        txtContent += `   📱 WhatsApp: ${site.contacts.whatsapp.join(', ')}\n`;
      }
      if (site.contacts.phones.length > 0) {
        txtContent += `   ☎️  电话: ${site.contacts.phones.join(', ')}\n`;
      }
      
      txtContent += '\n';
    });

    await fs.writeFile(txtFile, txtContent);
    console.log(`📝 文本报告已保存: ${txtFile}`);

    return { jsonFile, csvFile, txtFile };
  }
}

// 主函数
async function main() {
  const extractor = new BatchExtractor();
  
  try {
    console.log('🎯 开始批量提取欧洲Shopify网站联系方式...\n');
    
    const results = await extractor.batchProcess();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 批量处理完成!');
    console.log(`📊 最终统计:`);
    console.log(`   处理网站: ${extractor.processed} 个`);
    console.log(`   发现Shopify: ${results.length} 个`);
    console.log(`   成功率: ${((results.length / extractor.processed) * 100).toFixed(1)}%`);
    
    if (results.length > 0) {
      const withContacts = results.filter(r => r.totalContacts > 0).length;
      const totalContacts = results.reduce((sum, r) => sum + r.totalContacts, 0);
      
      console.log(`   有联系方式: ${withContacts} 个`);
      console.log(`   总联系方式: ${totalContacts} 个`);
      
      console.log('\n💾 保存结果到文件...');
      const files = await extractor.saveResults();
      
      console.log('\n🎊 任务完成！文件已生成：');
      console.log(`   📄 JSON: ${path.basename(files.jsonFile)}`);
      console.log(`   📊 CSV: ${path.basename(files.csvFile)}`);
      console.log(`   📝 TXT: ${path.basename(files.txtFile)}`);
    } else {
      console.log('\n⚠️  未找到有效的Shopify网站');
    }
    
  } catch (error) {
    console.error('❌ 处理出错:', error.message);
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = BatchExtractor;









