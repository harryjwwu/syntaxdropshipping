/**
 * 店小秘Cookie助手 - 实用的Cookie管理方案
 * 监控Cookie状态，提供简单的更新机制
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class DianXiaoMiCookieHelper {
  constructor() {
    this.baseUrl = 'https://www.dianxiaomi.com';
    this.cookieFile = './dianxiaomi-current-cookie.txt';
    this.currentCookie = null;
  }

  /**
   * 快速检测Cookie是否有效
   */
  async checkCookieStatus(cookie = null) {
    const testCookie = cookie || this.loadCookie();
    
    if (!testCookie) {
      return {
        valid: false,
        message: '没有找到Cookie',
        needUpdate: true
      };
    }

    try {
      console.log('🔍 检测Cookie有效性...');
      
      // 使用导出接口测试Cookie
      const response = await axios.post(
        `${this.baseUrl}/order/exportPackageOrder.json`,
        'templateId=-1&exportKeys=test&orderField=order_create_time&startTime=2025-01-01 00:00:00&endTime=2025-01-01 23:59:59&timeType=1&exportStyle=0&isVoided=-1&ruleId=-1&requestLocation=0&isSearch=1',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Cookie': testCookie,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://www.dianxiaomi.com/order.htm'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.uuid) {
        return {
          valid: true,
          message: 'Cookie有效',
          needUpdate: false,
          data: response.data
        };
      } else {
        return {
          valid: false,
          message: 'Cookie可能已过期（无法获取导出UUID）',
          needUpdate: true
        };
      }

    } catch (error) {
      const status = error.response?.status;
      
      if (status === 401 || status === 403) {
        return {
          valid: false,
          message: `Cookie已过期 (HTTP ${status})`,
          needUpdate: true
        };
      } else if (status === 302) {
        return {
          valid: false,
          message: 'Cookie已过期（被重定向到登录页）',
          needUpdate: true
        };
      } else {
        return {
          valid: false,
          message: `检测失败: ${error.message}`,
          needUpdate: true
        };
      }
    }
  }

  /**
   * 从文件加载Cookie
   */
  loadCookie() {
    try {
      if (fs.existsSync(this.cookieFile)) {
        this.currentCookie = fs.readFileSync(this.cookieFile, 'utf8').trim();
        return this.currentCookie;
      }
    } catch (error) {
      console.error('加载Cookie失败:', error.message);
    }
    return null;
  }

  /**
   * 保存Cookie到文件
   */
  saveCookie(cookie) {
    try {
      fs.writeFileSync(this.cookieFile, cookie);
      this.currentCookie = cookie;
      console.log('✅ Cookie保存成功');
      return true;
    } catch (error) {
      console.error('❌ 保存Cookie失败:', error.message);
      return false;
    }
  }

  /**
   * 手动更新Cookie（从浏览器复制）
   */
  async updateCookieFromBrowser(newCookie) {
    console.log('🔄 验证新Cookie...');
    
    const status = await this.checkCookieStatus(newCookie);
    
    if (status.valid) {
      this.saveCookie(newCookie);
      console.log('✅ Cookie更新成功！');
      return true;
    } else {
      console.log('❌ 新Cookie无效:', status.message);
      return false;
    }
  }

  /**
   * 获取当前有效的Cookie
   */
  async getCurrentValidCookie() {
    // 1. 尝试使用当前Cookie
    let cookie = this.loadCookie();
    
    if (cookie) {
      const status = await this.checkCookieStatus(cookie);
      if (status.valid) {
        return cookie;
      }
    }

    // 2. Cookie无效，提示用户更新
    console.log('\n🚨 Cookie已过期，需要手动更新！');
    console.log('📋 请按以下步骤获取新Cookie：');
    console.log('   1. 打开浏览器，访问: https://www.dianxiaomi.com');
    console.log('   2. 登录您的店小秘账号');
    console.log('   3. 按F12打开开发者工具');
    console.log('   4. 切换到Network标签');
    console.log('   5. 刷新页面，找到任意请求');
    console.log('   6. 在Request Headers中复制完整的Cookie值');
    console.log('   7. 调用 helper.updateCookieFromBrowser(cookie) 更新');
    console.log('\n💡 或者直接运行: node update-cookie.js');

    return null;
  }

  /**
   * 显示Cookie状态报告
   */
  async showStatus() {
    console.log('🔍 店小秘Cookie状态检查\n');
    
    const cookie = this.loadCookie();
    
    if (!cookie) {
      console.log('❌ 状态: 未找到Cookie文件');
      console.log('📁 文件位置:', path.resolve(this.cookieFile));
      console.log('💡 请先设置Cookie');
      return;
    }

    console.log('📁 Cookie文件:', path.resolve(this.cookieFile));
    console.log('📏 Cookie长度:', cookie.length, '字符');
    console.log('🔍 Cookie预览:', cookie.substring(0, 100) + '...');

    const status = await this.checkCookieStatus(cookie);
    
    console.log('\n📊 检测结果:');
    console.log('状态:', status.valid ? '✅ 有效' : '❌ 无效');
    console.log('信息:', status.message);
    
    if (status.needUpdate) {
      console.log('\n🔄 建议操作: 需要更新Cookie');
      this.showUpdateInstructions();
    }
  }

  /**
   * 显示Cookie更新说明
   */
  showUpdateInstructions() {
    console.log('\n📋 Cookie更新步骤:');
    console.log('1. 浏览器访问: https://www.dianxiaomi.com');
    console.log('2. 登录账号');
    console.log('3. F12 → Network → 复制任意请求的Cookie');
    console.log('4. 运行: node update-cookie.js');
  }
}

// 命令行工具
if (require.main === module) {
  const helper = new DianXiaoMiCookieHelper();
  helper.showStatus();
}

module.exports = DianXiaoMiCookieHelper;
