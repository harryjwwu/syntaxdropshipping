#!/usr/bin/env node

/**
 * 简单测试脚本 - 手动发现1个欧洲Shopify网站
 */

const axios = require('axios');
const cheerio = require('cheerio');

async function testDiscovery() {
  console.log('🔍 开始手动测试发现欧洲Shopify网站...\n');

  try {
    // 1. 从Shopify官方展示页面获取网站
    console.log('📂 正在访问Shopify官方展示页面...');
    const showcaseUrl = 'https://www.shopify.com/examples/fashion-apparel';
    
    const response = await axios.get(showcaseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    console.log(`✅ 成功访问展示页面 (状态: ${response.status})`);
    
    const $ = cheerio.load(response.data);
    const websites = [];

    // 提取网站链接
    $('a[href*="http"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && 
          !href.includes('shopify.com') && 
          !href.includes('facebook.com') &&
          !href.includes('instagram.com') &&
          (href.includes('.com') || href.includes('.de') || href.includes('.fr') || href.includes('.it') || href.includes('.es'))) {
        websites.push(href);
      }
    });

    console.log(`🎯 找到 ${websites.length} 个潜在网站链接`);

    // 测试前几个网站
    for (let i = 0; i < Math.min(5, websites.length); i++) {
      const website = websites[i];
      console.log(`\n🔍 测试网站 ${i + 1}: ${website}`);
      
      try {
        const siteResponse = await axios.get(website, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 8000
        });

        const siteHtml = siteResponse.data.toLowerCase();
        const site$ = cheerio.load(siteResponse.data);
        
        // 检查是否为Shopify网站
        const isShopify = siteHtml.includes('shopify') || 
                         siteHtml.includes('cdn.shopify.com') ||
                         siteHtml.includes('shopify-section');

        // 检查是否为欧洲网站
        const domain = new URL(website).hostname;
        const isEuropean = domain.endsWith('.de') || 
                          domain.endsWith('.fr') || 
                          domain.endsWith('.it') || 
                          domain.endsWith('.es') || 
                          domain.endsWith('.nl') || 
                          domain.endsWith('.co.uk');

        // 获取网站标题
        const title = site$('title').text().trim() || '无标题';
        
        console.log(`  📊 网站分析:`);
        console.log(`     标题: ${title}`);
        console.log(`     域名: ${domain}`);
        console.log(`     Shopify: ${isShopify ? '✅' : '❌'}`);
        console.log(`     欧洲网站: ${isEuropean ? '✅' : '❌'}`);

        if (isShopify && isEuropean) {
          console.log(`\n🎉 找到符合条件的网站!`);
          console.log(`📋 网站详情:`);
          console.log(`   🌐 URL: ${website}`);
          console.log(`   🏷️  标题: ${title}`);
          console.log(`   🗺️  域名: ${domain}`);
          
          // 尝试提取联系方式
          await testContactExtraction(website, siteResponse.data);
          
          return; // 找到一个就够了
        }

        await new Promise(resolve => setTimeout(resolve, 2000)); // 延迟2秒
      } catch (error) {
        console.log(`  ❌ 访问失败: ${error.message}`);
      }
    }

    console.log('\n⚠️  未找到符合条件的网站，让我尝试一些已知的欧洲Shopify网站...');
    
    // 测试一些已知的欧洲Shopify网站
    const knownSites = [
      'https://www.na-kd.com',
      'https://www.aboutyou.de',
      'https://www.zalando-lounge.de'
    ];

    for (const site of knownSites) {
      console.log(`\n🔍 测试已知网站: ${site}`);
      try {
        const testResult = await testKnownSite(site);
        if (testResult) {
          await testContactExtraction(site, testResult.html);
          break;
        }
      } catch (error) {
        console.log(`  ❌ 测试失败: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

async function testKnownSite(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const html = response.data.toLowerCase();
    const $ = cheerio.load(response.data);
    const title = $('title').text().trim();
    const domain = new URL(url).hostname;

    const isShopify = html.includes('shopify') || 
                     html.includes('cdn.shopify.com') ||
                     html.includes('shopify-section');

    console.log(`  📊 网站分析:`);
    console.log(`     标题: ${title}`);
    console.log(`     域名: ${domain}`);
    console.log(`     Shopify: ${isShopify ? '✅' : '❌'}`);

    if (isShopify) {
      console.log(`\n🎉 确认这是一个Shopify网站!`);
      console.log(`📋 网站详情:`);
      console.log(`   🌐 URL: ${url}`);
      console.log(`   🏷️  标题: ${title}`);
      console.log(`   🗺️  域名: ${domain}`);
      return { html: response.data, title, domain };
    }

    return null;
  } catch (error) {
    console.log(`  ❌ 访问失败: ${error.message}`);
    return null;
  }
}

async function testContactExtraction(url, html) {
  console.log(`\n📞 开始提取联系方式...`);
  
  try {
    const $ = cheerio.load(html);
    const contacts = {
      emails: [],
      phones: [],
      whatsapp: [],
      social: []
    };

    // 提取邮箱
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = html.match(emailRegex) || [];
    
    emailMatches.forEach(email => {
      email = email.toLowerCase();
      if (!email.includes('noreply') && 
          !email.includes('example.com') && 
          !contacts.emails.includes(email)) {
        contacts.emails.push(email);
      }
    });

    // 检查mailto链接
    $('a[href^="mailto:"]').each((i, el) => {
      const href = $(el).attr('href');
      const email = href.replace('mailto:', '').split('?')[0].toLowerCase();
      if (!contacts.emails.includes(email)) {
        contacts.emails.push(email);
      }
    });

    // 提取WhatsApp
    const whatsappPatterns = [
      /whatsapp[:\s]*\+?[\d\s\-\(\)]{10,20}/gi,
      /wa\.me\/[\+\d]{10,20}/gi
    ];
    
    whatsappPatterns.forEach(pattern => {
      const matches = html.match(pattern) || [];
      matches.forEach(match => {
        if (!contacts.whatsapp.includes(match)) {
          contacts.whatsapp.push(match);
        }
      });
    });

    // 检查WhatsApp链接
    $('a[href*="whatsapp"], a[href*="wa.me"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href && !contacts.whatsapp.includes(href)) {
        contacts.whatsapp.push(href);
      }
    });

    // 提取电话号码
    const phoneRegex = /\+[\d\s\-\(\)]{10,20}/g;
    const phoneMatches = html.match(phoneRegex) || [];
    phoneMatches.forEach(phone => {
      if (!contacts.phones.includes(phone)) {
        contacts.phones.push(phone);
      }
    });

    // 检查tel链接
    $('a[href^="tel:"]').each((i, el) => {
      const href = $(el).attr('href');
      const phone = href.replace('tel:', '').trim();
      if (!contacts.phones.includes(phone)) {
        contacts.phones.push(phone);
      }
    });

    // 提取社交媒体
    $('a[href*="instagram.com"], a[href*="facebook.com"], a[href*="linkedin.com"]').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href && !contacts.social.includes(href)) {
        contacts.social.push(href);
      }
    });

    // 显示结果
    console.log(`📊 联系方式提取结果:`);
    console.log(`   📧 邮箱 (${contacts.emails.length}个):`);
    contacts.emails.slice(0, 3).forEach(email => {
      console.log(`      ${email}`);
    });
    
    console.log(`   📱 WhatsApp (${contacts.whatsapp.length}个):`);
    contacts.whatsapp.slice(0, 2).forEach(wa => {
      console.log(`      ${wa}`);
    });
    
    console.log(`   ☎️  电话 (${contacts.phones.length}个):`);
    contacts.phones.slice(0, 2).forEach(phone => {
      console.log(`      ${phone}`);
    });
    
    console.log(`   🌐 社交媒体 (${contacts.social.length}个):`);
    contacts.social.slice(0, 2).forEach(social => {
      console.log(`      ${social}`);
    });

    const totalContacts = contacts.emails.length + contacts.whatsapp.length + 
                         contacts.phones.length + contacts.social.length;
    
    if (totalContacts > 0) {
      console.log(`\n🎉 成功提取到 ${totalContacts} 个联系方式!`);
    } else {
      console.log(`\n⚠️  未找到明显的联系方式，可能需要访问联系页面`);
    }

  } catch (error) {
    console.error('❌ 联系方式提取失败:', error.message);
  }
}

// 运行测试
testDiscovery().then(() => {
  console.log('\n✅ 测试完成!');
  console.log('\n📝 下一步可以:');
  console.log('  1. 扩大搜索范围找更多网站');
  console.log('  2. 访问联系页面获取更多联系方式');
  console.log('  3. 将结果保存到数据库');
}).catch(error => {
  console.error('❌ 测试出错:', error.message);
});









