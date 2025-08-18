#!/usr/bin/env node

/**
 * 店小秘Cookie定时刷新脚本
 * 用于Linux服务器定时任务，自动检查和刷新Cookie
 */

const DianXiaoMiCookieHelper = require('./dianxiaomi-cookie-helper');
const DianXiaoMiAutoLogin = require('./dianxiaomi-auto-login');

class CookieRefreshCron {
  constructor() {
    this.cookieHelper = new DianXiaoMiCookieHelper();
    this.autoLogin = new DianXiaoMiAutoLogin({
      headless: true, // 服务器必须无头模式
      maxRetries: 2
    });
  }

  /**
   * 主要刷新逻辑
   */
  async refreshCookie() {
    const timestamp = new Date().toISOString();
    console.log(`\n🕐 [${timestamp}] 开始Cookie检查...`);

    try {
      // 1. 检查当前Cookie状态
      console.log('🔍 检查当前Cookie有效性...');
      const status = await this.cookieHelper.checkCookieStatus();
      
      if (status.valid) {
        console.log('✅ Cookie仍然有效，无需刷新');
        console.log(`   消息: ${status.message}`);
        return {
          success: true,
          action: 'no_refresh_needed',
          message: 'Cookie仍然有效'
        };
      }

      console.log('⚠️ Cookie已过期或无效，开始自动刷新...');
      console.log(`   原因: ${status.message}`);

      // 2. 自动登录获取新Cookie
      console.log('🤖 启动自动登录流程...');
      
      let loginSuccess = false;
      for (let attempt = 1; attempt <= this.autoLogin.config.maxRetries; attempt++) {
        console.log(`🔄 第 ${attempt} 次登录尝试...`);
        
        try {
          await this.autoLogin.initBrowser();
          await this.autoLogin.initOCR();
          
          loginSuccess = await this.autoLogin.login();
          
          if (loginSuccess) {
            // 获取Cookie
            const cookies = await this.autoLogin.page.cookies();
            const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
            
            // 保存Cookie
            this.cookieHelper.saveCookie(cookieString);
            console.log('✅ Cookie刷新成功！');
            console.log(`   新Cookie长度: ${cookieString.length} 字符`);
            
            // 验证新Cookie
            const newStatus = await this.cookieHelper.checkCookieStatus();
            if (newStatus.valid) {
              console.log('✅ 新Cookie验证通过');
              return {
                success: true,
                action: 'refreshed',
                message: '成功刷新Cookie',
                cookieLength: cookieString.length
              };
            } else {
              throw new Error('新Cookie验证失败');
            }
          }
          
        } catch (error) {
          console.error(`❌ 第 ${attempt} 次尝试失败: ${error.message}`);
          if (attempt < this.autoLogin.config.maxRetries) {
            console.log(`⏳ ${this.autoLogin.config.retryDelay / 1000}秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, this.autoLogin.config.retryDelay));
          }
        } finally {
          await this.autoLogin.cleanup();
        }
      }

      if (!loginSuccess) {
        throw new Error(`登录失败，已重试 ${this.autoLogin.config.maxRetries} 次`);
      }

    } catch (error) {
      console.error('❌ Cookie刷新失败:', error.message);
      
      // 发送告警 (可以集成邮件、钉钉、企业微信等)
      await this.sendAlert(error);
      
      return {
        success: false,
        action: 'refresh_failed',
        message: error.message
      };
    }
  }

  /**
   * 发送告警通知
   */
  async sendAlert(error) {
    const timestamp = new Date().toISOString();
    const alertMessage = `
🚨 店小秘Cookie刷新失败告警

时间: ${timestamp}
错误: ${error.message}

请检查：
1. 网络连接是否正常
2. 店小秘网站是否可访问
3. 登录凭据是否正确
4. 服务器资源是否充足

服务器: ${require('os').hostname()}
进程: ${process.pid}
    `;

    console.log(alertMessage);

    // 这里可以集成各种告警方式
    // 例如：邮件、短信、钉钉机器人、企业微信等
    
    // 示例：写入告警日志文件
    const fs = require('fs');
    const alertLogFile = '/var/log/dxm-cookie-alert.log';
    try {
      fs.appendFileSync(alertLogFile, alertMessage + '\n');
    } catch (logError) {
      console.error('无法写入告警日志:', logError.message);
    }
  }

  /**
   * 获取系统状态
   */
  getSystemInfo() {
    const os = require('os');
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      freemem: os.freemem(),
      totalmem: os.totalmem(),
      cpus: os.cpus().length
    };
  }

  /**
   * 运行健康检查
   */
  async healthCheck() {
    console.log('🏥 运行系统健康检查...');
    
    const sysInfo = this.getSystemInfo();
    console.log('💻 系统信息:');
    console.log(`   主机名: ${sysInfo.hostname}`);
    console.log(`   平台: ${sysInfo.platform} ${sysInfo.arch}`);
    console.log(`   Node.js: ${sysInfo.nodeVersion}`);
    console.log(`   运行时间: ${Math.floor(sysInfo.uptime / 3600)}小时`);
    console.log(`   CPU核心: ${sysInfo.cpus}`);
    console.log(`   内存使用: ${Math.floor((sysInfo.totalmem - sysInfo.freemem) / 1024 / 1024)}MB / ${Math.floor(sysInfo.totalmem / 1024 / 1024)}MB`);

    // 检查Chrome是否可用
    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      await browser.close();
      console.log('✅ Chrome浏览器检查通过');
    } catch (error) {
      console.error('❌ Chrome浏览器检查失败:', error.message);
      throw new Error('Chrome浏览器不可用');
    }

    // 检查网络连接
    try {
      const https = require('https');
      await new Promise((resolve, reject) => {
        const req = https.get('https://www.dianxiaomi.com', (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
        req.on('error', reject);
        req.setTimeout(10000, () => reject(new Error('请求超时')));
      });
      console.log('✅ 网络连接检查通过');
    } catch (error) {
      console.error('❌ 网络连接检查失败:', error.message);
      throw new Error('无法访问店小秘网站');
    }

    console.log('✅ 健康检查完成');
  }
}

// 主函数
async function main() {
  const cron = new CookieRefreshCron();
  
  try {
    // 如果传入--health参数，只进行健康检查
    if (process.argv.includes('--health')) {
      await cron.healthCheck();
      process.exit(0);
    }

    // 正常的Cookie刷新流程
    const result = await cron.refreshCookie();
    
    // 输出结果供监控系统使用
    console.log('\n📊 执行结果:');
    console.log(JSON.stringify(result, null, 2));
    
    // 设置退出码
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 程序执行失败:', error.message);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('💥 未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = CookieRefreshCron;
