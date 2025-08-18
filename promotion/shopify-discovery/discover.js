#!/usr/bin/env node

/**
 * 欧洲Shopify独立站发现系统
 * 专门用于发现和收集欧洲地区的Shopify电商独立站
 */

const axios = require('axios');
const cheerio = require('cheerio');
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config/.env') });

class ShopifyDiscovery {
  constructor() {
    this.config = {
      delay: parseInt(process.env.REQUEST_DELAY) || 2000,
      maxConcurrent: parseInt(process.env.MAX_CONCURRENT) || 5,
      timeout: 10000,
      userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    this.europeanCountries = {
      'DE': 'Germany',
      'FR': 'France', 
      'IT': 'Italy',
      'ES': 'Spain',
      'NL': 'Netherlands',
      'GB': 'United Kingdom',
      'BE': 'Belgium',
      'AT': 'Austria',
      'CH': 'Switzerland',
      'SE': 'Sweden',
      'DK': 'Denmark',
      'NO': 'Norway'
    };

    this.discoveredSites = new Set();
    this.processedSites = new Set();
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
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await axios.get(url, config);
      return response;
    } catch (error) {
      console.error(`❌ Request failed for ${url}: ${error.message}`);
      return null;
    }
  }

  // 1. Shopify官方展示发现
  async discoverShopifyShowcase() {
    console.log('🔍 Discovering from Shopify official showcase...');
    
    const categories = [
      'fashion-apparel', 'jewelry-accessories', 'health-beauty',
      'home-garden', 'electronics', 'sports-recreation',
      'food-drink', 'arts-entertainment', 'business-services'
    ];

    const websites = new Set();

    for (const category of categories) {
      try {
        console.log(`  📂 Scraping category: ${category}`);
        const url = `https://www.shopify.com/examples/${category}`;
        const response = await this.safeRequest(url);
        
        if (!response) continue;

        const $ = cheerio.load(response.data);
        
        // 提取展示网站链接
        $('.showcase-item a, .example-store a, [data-merchant-url]').each((i, el) => {
          let href = $(el).attr('href') || $(el).attr('data-merchant-url');
          
          if (href && href.startsWith('http')) {
            websites.add(href);
          }
        });

        // 也检查页面中的链接文本
        $('a').each((i, el) => {
          const href = $(el).attr('href');
          if (href && (href.includes('.myshopify.com') || this.looksLikeShopifyStore(href))) {
            websites.add(href);
          }
        });

        await this.delay(this.config.delay);
      } catch (error) {
        console.error(`❌ Error scraping category ${category}:`, error.message);
      }
    }

    console.log(`✅ Found ${websites.size} websites from Shopify showcase`);
    return Array.from(websites);
  }

  // 2. 通过Google搜索发现Shopify站点
  async discoverViaSearch() {
    console.log('🔍 Discovering via search patterns...');
    
    const searchPatterns = [
      // 直接搜索.myshopify.com域名
      'site:myshopify.com',
      
      // 按国家搜索Shopify特征
      '"powered by shopify" site:.de',
      '"powered by shopify" site:.fr', 
      '"powered by shopify" site:.it',
      '"powered by shopify" site:.es',
      '"powered by shopify" site:.nl',
      '"powered by shopify" site:.co.uk',
      
      // 搜索Shopify特有的URL模式
      'inurl:"collections" "powered by shopify"',
      'inurl:"products" site:.de "shopify"',
      'inurl:"cart" site:.fr "shopify"',
      
      // 搜索常见电商关键词 + Shopify
      '"add to cart" "shopify" site:.de',
      '"buy now" "shopify" site:.fr',
      '"checkout" "shopify" site:.it'
    ];

    // 注意：这里需要真实的搜索API
    // 可以使用SerpAPI、ScrapingBee等服务
    const websites = new Set();

    if (process.env.SERPAPI_KEY) {
      for (const pattern of searchPatterns) {
        try {
          console.log(`  🔎 Searching: ${pattern}`);
          const response = await this.safeRequest('https://serpapi.com/search', {
            params: {
              q: pattern,
              engine: 'google',
              num: 50,
              api_key: process.env.SERPAPI_KEY
            }
          });

          if (response && response.data && response.data.organic_results) {
            response.data.organic_results.forEach(result => {
              if (result.link) {
                websites.add(result.link);
              }
            });
          }

          await this.delay(this.config.delay);
        } catch (error) {
          console.error(`❌ Search error for "${pattern}":`, error.message);
        }
      }
    } else {
      console.log('⚠️  No SerpAPI key found, skipping search discovery');
    }

    console.log(`✅ Found ${websites.size} websites via search`);
    return Array.from(websites);
  }

  // 3. 从已知Shopify站点发现相关站点
  async discoverRelatedSites(seedSites) {
    console.log('🔍 Discovering related sites...');
    
    const relatedSites = new Set();

    // 这里可以实现：
    // 1. 分析已知站点的外链
    // 2. 查找相似的设计模板
    // 3. 分析相同的Shopify apps使用者
    
    // 简单实现：从种子站点的页面中寻找其他Shopify链接
    for (const siteUrl of seedSites.slice(0, 10)) { // 限制处理数量
      try {
        const response = await this.safeRequest(siteUrl);
        if (!response) continue;

        const $ = cheerio.load(response.data);
        
        // 查找页面中的其他Shopify链接
        $('a[href*="shopify"], a[href*=".myshopify.com"]').each((i, el) => {
          const href = $(el).attr('href');
          if (href && this.looksLikeShopifyStore(href)) {
            relatedSites.add(href);
          }
        });

        await this.delay(this.config.delay);
      } catch (error) {
        console.error(`❌ Error analyzing ${siteUrl}:`, error.message);
      }
    }

    console.log(`✅ Found ${relatedSites.size} related sites`);
    return Array.from(relatedSites);
  }

  // 4. 验证是否为Shopify站点
  async verifyShopifyStore(url) {
    try {
      const response = await this.safeRequest(url);
      if (!response) return false;

      const html = response.data.toLowerCase();
      const headers = response.headers;

      // Shopify特征检测
      const shopifyIndicators = [
        'cdn.shopify.com',
        'shopify.theme',
        'shopify-section',
        'shopify.money',
        '/wpm@',
        'shopify-features',
        'shopify.routes'
      ];

      const hasShopifyIndicators = shopifyIndicators.some(indicator => 
        html.includes(indicator)
      );

      // 检查HTTP headers
      const hasShopifyHeaders = 
        headers['x-shopify-stage'] ||
        headers['x-shopify-shop'] ||
        (headers['server'] && headers['server'].includes('cloudflare'));

      // 检查是否能访问Shopify特有的端点
      let hasShopifyEndpoints = false;
      try {
        const cartResponse = await this.safeRequest(`${url}/cart.json`);
        if (cartResponse && cartResponse.status === 200) {
          hasShopifyEndpoints = true;
        }
      } catch (error) {
        // 忽略错误，继续其他检查
      }

      return hasShopifyIndicators || hasShopifyHeaders || hasShopifyEndpoints;
    } catch (error) {
      console.error(`❌ Error verifying ${url}:`, error.message);
      return false;
    }
  }

  // 5. 检测网站地理位置和语言
  async detectLocationAndLanguage(url) {
    try {
      const response = await this.safeRequest(url);
      if (!response) return { country: null, language: null };

      const $ = cheerio.load(response.data);
      const domain = new URL(url).hostname;
      
      // 通过域名后缀检测国家
      let country = null;
      for (const [code, name] of Object.entries(this.europeanCountries)) {
        const tld = code === 'GB' ? '.co.uk' : `.${code.toLowerCase()}`;
        if (domain.endsWith(tld)) {
          country = { code, name };
          break;
        }
      }

      // 通过HTML lang属性检测语言
      let language = $('html').attr('lang') || '';
      if (!language) {
        // 尝试从meta标签获取
        language = $('meta[http-equiv="content-language"]').attr('content') || '';
      }

      // 如果还没找到国家，尝试通过语言推断
      if (!country && language) {
        const langToCountry = {
          'de': { code: 'DE', name: 'Germany' },
          'fr': { code: 'FR', name: 'France' },
          'it': { code: 'IT', name: 'Italy' },
          'es': { code: 'ES', name: 'Spain' },
          'nl': { code: 'NL', name: 'Netherlands' }
        };
        
        const langCode = language.split('-')[0].toLowerCase();
        country = langToCountry[langCode] || null;
      }

      // 检查货币符号来确认欧洲地区
      const text = response.data;
      const hasEuropeanCurrency = /[€£]|EUR|GBP|CHF|SEK|DKK|NOK/.test(text);

      return {
        country,
        language: language.toLowerCase(),
        isEuropean: !!country || hasEuropeanCurrency
      };
    } catch (error) {
      console.error(`❌ Error detecting location for ${url}:`, error.message);
      return { country: null, language: null, isEuropean: false };
    }
  }

  // 6. 提取网站基本信息
  async extractSiteInfo(url) {
    try {
      const response = await this.safeRequest(url);
      if (!response) return null;

      const $ = cheerio.load(response.data);
      
      const title = $('title').text().trim() || '';
      const description = $('meta[name="description"]').attr('content') || '';
      
      // 尝试检测网站类别
      let category = 'unknown';
      const titleAndDesc = (title + ' ' + description).toLowerCase();
      
      const categoryKeywords = {
        'fashion': ['fashion', 'clothing', 'apparel', 'dress', 'shirt', 'style'],
        'electronics': ['electronics', 'gadgets', 'tech', 'phone', 'computer'],
        'beauty': ['beauty', 'cosmetics', 'skincare', 'makeup'],
        'home': ['home', 'furniture', 'decor', 'kitchen'],
        'jewelry': ['jewelry', 'rings', 'necklace', 'watches'],
        'sports': ['sports', 'fitness', 'athletic', 'gym'],
        'food': ['food', 'gourmet', 'organic', 'nutrition']
      };

      for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => titleAndDesc.includes(keyword))) {
          category = cat;
          break;
        }
      }

      return {
        title: title.substring(0, 500),
        description: description.substring(0, 1000),
        category
      };
    } catch (error) {
      console.error(`❌ Error extracting info for ${url}:`, error.message);
      return null;
    }
  }

  // 7. 保存到数据库
  async saveToDatabase(siteData) {
    try {
      const query = `
        INSERT INTO discovered_websites 
        (url, domain, platform, country_code, country_name, language, title, description, category, discovery_method, tech_stack)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        last_checked = CURRENT_TIMESTAMP,
        title = VALUES(title),
        description = VALUES(description),
        category = VALUES(category),
        updated_at = CURRENT_TIMESTAMP
      `;

      const domain = new URL(siteData.url).hostname;
      
      await this.db.execute(query, [
        siteData.url,
        domain,
        'shopify',
        siteData.country?.code || null,
        siteData.country?.name || null,
        siteData.language || null,
        siteData.title || null,
        siteData.description || null,
        siteData.category || 'unknown',
        siteData.discoveryMethod || 'automated',
        JSON.stringify({ platform: 'shopify', verified: true })
      ]);

      return true;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`ℹ️  Site already exists: ${siteData.url}`);
        return true;
      }
      console.error(`❌ Database save error for ${siteData.url}:`, error.message);
      return false;
    }
  }

  // 辅助函数：判断URL是否像Shopify店铺
  looksLikeShopifyStore(url) {
    return url.includes('.myshopify.com') || 
           url.includes('shopify') ||
           /\/(collections|products|cart)\//.test(url);
  }

  // 8. 主发现流程
  async discover() {
    console.log('🚀 Starting European Shopify discovery...\n');

    try {
      await this.connectDB();

      const allWebsites = new Set();

      // 1. Shopify官方展示
      const showcaseWebsites = await this.discoverShopifyShowcase();
      showcaseWebsites.forEach(site => allWebsites.add(site));

      // 2. 搜索引擎发现
      const searchWebsites = await this.discoverViaSearch();
      searchWebsites.forEach(site => allWebsites.add(site));

      // 3. 相关站点发现
      const relatedWebsites = await this.discoverRelatedSites(showcaseWebsites);
      relatedWebsites.forEach(site => allWebsites.add(site));

      console.log(`\n📊 Total unique websites found: ${allWebsites.size}`);
      console.log('🔍 Starting verification and processing...\n');

      const validSites = [];
      let processed = 0;

      for (const website of allWebsites) {
        processed++;
        console.log(`Processing ${processed}/${allWebsites.size}: ${website}`);

        try {
          // 1. 验证是否为Shopify站点
          const isShopify = await this.verifyShopifyStore(website);
          if (!isShopify) {
            console.log(`  ❌ Not a Shopify store`);
            continue;
          }

          // 2. 检测地理位置
          const location = await this.detectLocationAndLanguage(website);
          if (!location.isEuropean) {
            console.log(`  ❌ Not European`);
            continue;
          }

          // 3. 提取网站信息
          const siteInfo = await this.extractSiteInfo(website);
          if (!siteInfo) {
            console.log(`  ❌ Failed to extract site info`);
            continue;
          }

          // 4. 组装数据
          const siteData = {
            url: website,
            country: location.country,
            language: location.language,
            title: siteInfo.title,
            description: siteInfo.description,
            category: siteInfo.category,
            discoveryMethod: 'automated_discovery'
          };

          // 5. 保存到数据库
          const saved = await this.saveToDatabase(siteData);
          if (saved) {
            validSites.push(siteData);
            console.log(`  ✅ Saved - ${location.country?.name || 'Unknown'} - ${siteInfo.category}`);
          } else {
            console.log(`  ❌ Failed to save`);
          }

          await this.delay(this.config.delay);
        } catch (error) {
          console.log(`  ❌ Error: ${error.message}`);
        }
      }

      return validSites;
    } catch (error) {
      console.error('❌ Discovery failed:', error.message);
      throw error;
    } finally {
      if (this.db) {
        await this.db.end();
      }
    }
  }

  // 9. 生成报告
  async generateReport(sites) {
    console.log('\n📊 Discovery Report');
    console.log('==================');
    console.log(`Total valid sites found: ${sites.length}`);

    // 按国家统计
    const byCountry = {};
    sites.forEach(site => {
      const country = site.country?.name || 'Unknown';
      byCountry[country] = (byCountry[country] || 0) + 1;
    });

    console.log('\n🌍 By Country:');
    Object.entries(byCountry).forEach(([country, count]) => {
      console.log(`  ${country}: ${count} sites`);
    });

    // 按类别统计
    const byCategory = {};
    sites.forEach(site => {
      byCategory[site.category] = (byCategory[site.category] || 0) + 1;
    });

    console.log('\n📂 By Category:');
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} sites`);
    });

    // 保存详细报告到文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, '../results', `discovery-report-${timestamp}.json`);
    
    const report = {
      discoveryDate: new Date().toISOString(),
      totalSites: sites.length,
      byCountry,
      byCategory,
      sites: sites
    };

    try {
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Detailed report saved: ${reportPath}`);
    } catch (error) {
      console.error('❌ Failed to save report:', error.message);
    }
  }
}

// 主执行函数
async function main() {
  const discovery = new ShopifyDiscovery();
  
  try {
    const sites = await discovery.discover();
    
    console.log('\n🎉 Discovery completed!');
    
    if (sites.length > 0) {
      await discovery.generateReport(sites);
      
      console.log('\n📝 Next steps:');
      console.log('  1. Run email extraction: npm run extract-emails');
      console.log('  2. Review discovered sites in database');
      console.log('  3. Set up email campaigns');
    } else {
      console.log('⚠️  No valid sites found. Check your configuration.');
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

module.exports = ShopifyDiscovery;









