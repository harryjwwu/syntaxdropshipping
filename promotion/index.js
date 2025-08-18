#!/usr/bin/env node

/**
 * 欧洲Shopify推广系统主入口
 * 统一管理发现、提取和推广流程
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config/.env') });

const ShopifyDiscovery = require('./shopify-discovery/discover');
const ContactExtractor = require('./email-extraction/contact-extractor');

class PromotionSystem {
  constructor() {
    this.discovery = new ShopifyDiscovery();
    this.extractor = new ContactExtractor();
  }

  // 显示帮助信息
  showHelp() {
    console.log(`
🚀 Syntax Dropshipping - 欧洲Shopify推广系统
===============================================

用法: node index.js <command> [options]

可用命令:
  discover [limit]     发现欧洲Shopify独立站 (默认: 100)
  extract [limit]      提取联系方式 (默认: 50)  
  full-process [limit] 完整流程: 发现 + 提取 (默认: 50)
  help                 显示此帮助信息

示例:
  node index.js discover 200        # 发现200个网站
  node index.js extract 30          # 提取30个网站的联系方式
  node index.js full-process 100    # 完整处理100个网站

配置:
  1. 复制 config/env.example 到 config/.env
  2. 配置数据库连接信息
  3. 可选: 配置API keys以获得更好效果

数据库设置:
  npm run setup-db                  # 初始化数据库

分步执行:
  npm run discover                  # 仅发现网站
  npm run extract-emails            # 仅提取联系方式
`);
  }

  // 执行完整流程
  async runFullProcess(limit = 50) {
    console.log('🚀 Starting full promotion process...\n');
    
    try {
      // 1. 发现网站
      console.log('📍 Step 1: Discovering Shopify websites...');
      const discoveredSites = await this.discovery.discover();
      
      if (discoveredSites.length === 0) {
        console.log('⚠️  No websites discovered. Check your configuration.');
        return;
      }

      console.log(`✅ Discovered ${discoveredSites.length} websites\n`);
      
      // 2. 提取联系方式
      console.log('📞 Step 2: Extracting contact information...');
      const extractionResults = await this.extractor.extract(limit);
      
      console.log(`✅ Processed ${extractionResults.length} websites for contacts\n`);

      // 3. 生成综合报告
      await this.generateCombinedReport(discoveredSites, extractionResults);

      console.log('\n🎉 Full process completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('  1. Review results in database');
      console.log('  2. Set up email/WhatsApp campaigns');
      console.log('  3. Start outreach to potential customers');

    } catch (error) {
      console.error('❌ Full process failed:', error.message);
      throw error;
    }
  }

  // 生成综合报告
  async generateCombinedReport(discoveredSites, extractionResults) {
    console.log('\n📊 Combined Process Report');
    console.log('==========================');
    
    // 发现统计
    const discoveryStats = {
      total: discoveredSites.length,
      byCountry: {},
      byCategory: {}
    };

    discoveredSites.forEach(site => {
      const country = site.country?.name || 'Unknown';
      discoveryStats.byCountry[country] = (discoveryStats.byCountry[country] || 0) + 1;
      
      const category = site.category || 'unknown';
      discoveryStats.byCategory[category] = (discoveryStats.byCategory[category] || 0) + 1;
    });

    // 联系方式统计
    const contactStats = {
      totalProcessed: extractionResults.length,
      withContacts: extractionResults.filter(r => r.totalContacts > 0).length,
      totalContacts: extractionResults.reduce((sum, r) => sum + r.totalContacts, 0)
    };

    console.log('\n🌍 Discovery Results:');
    console.log(`  Total websites found: ${discoveryStats.total}`);
    console.log('  By country:');
    Object.entries(discoveryStats.byCountry).forEach(([country, count]) => {
      console.log(`    ${country}: ${count} sites`);
    });

    console.log('\n📞 Contact Extraction Results:');
    console.log(`  Websites processed: ${contactStats.totalProcessed}`);
    console.log(`  Websites with contacts: ${contactStats.withContacts}`);
    console.log(`  Total contact methods: ${contactStats.totalContacts}`);
    
    const successRate = ((contactStats.withContacts / contactStats.totalProcessed) * 100).toFixed(1);
    console.log(`  Success rate: ${successRate}%`);

    // 保存报告到文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, 'results', `combined-report-${timestamp}.json`);
    
    const report = {
      processDate: new Date().toISOString(),
      discovery: {
        totalSites: discoveryStats.total,
        byCountry: discoveryStats.byCountry,
        byCategory: discoveryStats.byCategory,
        sites: discoveredSites
      },
      contactExtraction: {
        totalProcessed: contactStats.totalProcessed,
        withContacts: contactStats.withContacts,
        totalContacts: contactStats.totalContacts,
        successRate: parseFloat(successRate),
        results: extractionResults
      }
    };

    try {
      const fs = require('fs').promises;
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Combined report saved: ${reportPath}`);
    } catch (error) {
      console.error('❌ Failed to save report:', error.message);
    }
  }

  // 运行指定命令
  async run(command, ...args) {
    try {
      switch (command) {
        case 'discover':
          const discoverLimit = parseInt(args[0]) || 100;
          console.log(`🔍 Starting discovery (limit: ${discoverLimit})...`);
          const sites = await this.discovery.discover();
          await this.discovery.generateReport(sites);
          break;

        case 'extract':
          const extractLimit = parseInt(args[0]) || 50;
          console.log(`📞 Starting contact extraction (limit: ${extractLimit})...`);
          const results = await this.extractor.extract(extractLimit);
          await this.extractor.generateReport(results);
          break;

        case 'full-process':
          const fullLimit = parseInt(args[0]) || 50;
          await this.runFullProcess(fullLimit);
          break;

        case 'help':
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      console.error(`❌ Command '${command}' failed:`, error.message);
      process.exit(1);
    }
  }
}

// 主执行逻辑
async function main() {
  const system = new PromotionSystem();
  
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  await system.run(command, ...args.slice(1));
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = PromotionSystem;









