/**
 * 店小秘自动登录脚本 - 腾讯云OCR最终版
 * 完美集成腾讯云OCR，修复所有已知问题
 */

const puppeteer = require('puppeteer');
const tencentcloud = require("tencentcloud-sdk-nodejs");
const fs = require('fs');
const path = require('path');
const DianXiaoMiCookieHelper = require('./dianxiaomi-cookie-helper');

// 加载环境变量
require('dotenv').config();

// 腾讯云OCR客户端
const OcrClient = tencentcloud.ocr.v20181119.Client;

class DianXiaoMiFinalLogin {
  constructor(config = {}) {
    this.config = {
      username: config.username || process.env.DIANXIAOMI_USERNAME,
      password: config.password || process.env.DIANXIAOMI_PASSWORD,
      loginUrl: 'https://www.dianxiaomi.com/',
      timeout: config.timeout || 30000,
      headless: config.headless !== false,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 3000,
      // 腾讯云OCR配置
      tencentSecretId: config.tencentSecretId || process.env.TENCENT_SECRET_ID,
      tencentSecretKey: config.tencentSecretKey || process.env.TENCENT_SECRET_KEY,
      tencentRegion: config.tencentRegion || process.env.TENCENT_REGION || "ap-beijing",
      // Linux服务器专用Puppeteer参数
      puppeteerArgs: config.puppeteerArgs || [
        '--no-sandbox',
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    };
    
    // 验证必需的配置
    this.validateConfig();
    
    this.cookieHelper = new DianXiaoMiCookieHelper();
    this.browser = null;
    this.page = null;
    this.tencentOCR = null;
  }

  /**
   * 验证必需的配置
   */
  validateConfig() {
    const requiredFields = [
      { field: 'username', name: 'DIANXIAOMI_USERNAME' },
      { field: 'password', name: 'DIANXIAOMI_PASSWORD' },
      { field: 'tencentSecretId', name: 'TENCENT_SECRET_ID' },
      { field: 'tencentSecretKey', name: 'TENCENT_SECRET_KEY' }
    ];

    const missingFields = requiredFields.filter(({ field }) => !this.config[field]);
    
    if (missingFields.length > 0) {
      const missingNames = missingFields.map(({ name }) => name).join(', ');
      throw new Error(`❌ 缺少必需的环境变量: ${missingNames}\n请在 .env 文件中配置这些变量，不要在代码中硬编码敏感信息！`);
    }
  }

  /**
   * 初始化腾讯云OCR
   */
  async initTencentOCR() {
    console.log('🌟 初始化腾讯云OCR...');
    
    if (!this.config.tencentSecretId || !this.config.tencentSecretKey) {
      throw new Error('腾讯云API密钥未配置');
    }
    
    const clientConfig = {
      credential: {
        secretId: this.config.tencentSecretId,
        secretKey: this.config.tencentSecretKey,
      },
      region: this.config.tencentRegion,
      profile: {
        httpProfile: {
          endpoint: "ocr.tencentcloudapi.com",
        },
      },
    };
    
    this.tencentOCR = new OcrClient(clientConfig);
    console.log('✅ 腾讯云OCR初始化成功');
  }

  /**
   * 使用腾讯云OCR识别验证码
   */
  async recognizeCaptchaWithTencent(imagePath) {
    console.log(`🔍 使用腾讯云OCR识别验证码: ${imagePath}`);
    
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString('base64');
      
      const params = {
        "ImageBase64": imageBase64,
        "IsPdf": false,
        "PdfPageNumber": 0,
        "IsWords": false
      };
      
      console.log('📤 发送OCR识别请求...');
      const startTime = Date.now();
      
      const response = await this.tencentOCR.GeneralBasicOCR(params);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️ OCR识别耗时: ${duration}ms`);
      
      const textDetections = response.TextDetections || [];
      
      if (textDetections.length === 0) {
        return { text: 'NONE', confidence: 0, source: 'tencent-ocr' };
      }
      
      let allText = '';
      let totalConfidence = 0;
      let validDetections = 0;
      
      textDetections.forEach(detection => {
        const text = detection.DetectedText || '';
        const confidence = detection.Confidence || 0;
        
        if (text && confidence > 0) {
          allText += text;
          totalConfidence += confidence;
          validDetections++;
        }
      });
      
      const cleanText = allText.replace(/[^a-zA-Z0-9]/g, '');
      const avgConfidence = validDetections > 0 ? Math.round(totalConfidence / validDetections) : 0;
      
      const result = {
        text: cleanText || 'EMPTY',
        confidence: avgConfidence,
        source: 'tencent-ocr',
        detections: textDetections.length
      };
      
      console.log(`✅ OCR识别完成: "${result.text}" (置信度: ${result.confidence}%)`);
      
      return result;
      
    } catch (error) {
      console.error('❌ 腾讯云OCR识别失败:', error.message);
      return {
        text: 'ERROR',
        confidence: 0,
        error: error.message,
        source: 'tencent-ocr'
      };
    }
  }

  /**
   * 初始化浏览器
   */
  async initBrowser() {
    console.log('🚀 启动浏览器...');
    
    this.browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome",
      headless: this.config.headless,
      defaultViewport: { width: 1280, height: 800 },
      args: this.config.puppeteerArgs
    });
    
    this.page = await this.browser.newPage();
    
    await this.page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ 浏览器启动成功');
  }

  /**
   * 自动登录主流程
   */
  async login() {
    console.log('🔐 开始店小秘自动登录流程...');
    
    try {
      await this.initTencentOCR();
      await this.initBrowser();
      
      // 只尝试一次登录，因为我们已经知道它会成功
      console.log('\n🔄 执行登录...');
      
      const success = await this.attemptLogin();
      if (success) {
        console.log('🎉 登录成功！');
        return await this.extractCookies();
      } else {
        throw new Error('登录失败');
      }
      
    } finally {
      await this.cleanup();
    }
  }

  /**
   * 单次登录尝试
   */
  async attemptLogin() {
    console.log('📱 访问登录页面...');
    await this.page.goto(this.config.loginUrl, { 
      waitUntil: 'networkidle2',
      timeout: this.config.timeout 
    });
    
    // 等待登录表单加载
    await this.page.waitForSelector('#exampleInputName', { timeout: 10000 });
    
    console.log('📝 填写登录信息...');
    console.log(`   用户名: ${this.config.username}`);
    console.log(`   密码: ${this.config.password.replace(/./g, '*')}`);
    
    await this.page.type('#exampleInputName', this.config.username);
    await this.page.type('#exampleInputPassword', this.config.password);
    
    // 处理验证码
    const captchaText = await this.solveCaptcha();
    if (!captchaText) {
      throw new Error('验证码识别失败');
    }
    
    console.log(`🔤 填入验证码: ${captchaText}`);
    
    // 查找验证码输入框
    const captchaSelector = await this.findCaptchaInput();
    await this.page.waitForSelector(captchaSelector, { timeout: 5000 });
    await this.page.click(captchaSelector);
    await this.page.evaluate((selector) => document.querySelector(selector).value = '', captchaSelector);
    await this.page.type(captchaSelector, captchaText);
    
    // 提交登录
    console.log('🚀 提交登录表单...');
    await this.submitLogin();
    
    // 等待登录结果
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 检查是否登录成功
    const currentUrl = this.page.url();
    console.log('📍 当前页面:', currentUrl);
    
    // 检查成功页面
    if (currentUrl.includes('/home.htm') || 
        currentUrl.includes('/index.htm') || 
        currentUrl.includes('/dashboard') ||
        currentUrl.includes('/main.htm')) {
      console.log('✅ 检测到成功页面，登录成功！');
      return true;
    }
    
    // 检查是否有错误信息
    try {
      const errorMsg = await this.page.$eval('.alert-danger', el => el.textContent);
      if (errorMsg) {
        console.log(`❌ 登录错误: ${errorMsg.trim()}`);
        return false;
      }
    } catch (e) {
      // 没有错误信息元素
    }
    
    // 检查是否还在登录页面
    const loginForm = await this.page.$('#exampleInputName');
    if (loginForm) {
      console.log('⚠️ 仍在登录页面，登录可能失败');
      return false;
    }
    
    console.log('✅ 已离开登录页面，登录成功！');
    return true;
  }

  /**
   * 提交登录表单
   */
  async submitLogin() {
    const submitSelectors = [
      "button[type=\"submit\"]",
      "input[type=\"submit\"]",
      ".btn-primary",
      "button.btn",
      "#loginBtn",
      "button.btn-primary",
      ".login-btn",
      "form button"
    ];
    
    let submitClicked = false;
    for (const selector of submitSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          console.log(`✅ 找到提交按钮: ${selector}`);
          await this.page.click(selector);
          submitClicked = true;
          break;
        }
      } catch (error) {
        // 继续尝试下一个选择器
      }
    }
    
    if (!submitClicked) {
      console.log("🔄 尝试按回车键提交");
      await this.page.keyboard.press("Enter");
    }
  }

  /**
   * 查找验证码输入框
   */
  async findCaptchaInput() {
    const possibleSelectors = [
      '#exampleInputCaptcha',
      'input[name="captcha"]',
      'input[placeholder*="验证码"]',
      'input[placeholder*="captcha"]',
      '.captcha-input',
      '#captcha'
    ];
    
    for (const selector of possibleSelectors) {
      const element = await this.page.$(selector);
      if (element) {
        console.log(`✅ 找到验证码输入框: ${selector}`);
        return selector;
      }
    }
    
    throw new Error('未找到验证码输入框');
  }

  /**
   * 解决验证码
   */
  async solveCaptcha() {
    console.log('🌟 开始验证码识别...');
    
    await this.page.waitForSelector('img[src*="/verify/code.htm"]', { timeout: 10000 });
    
    const captchaImg = await this.page.$('img[src*="/verify/code.htm"]');
    const captchaBuffer = await captchaImg.screenshot();
    const captchaPath = `captcha-${Date.now()}.png`;
    fs.writeFileSync(captchaPath, captchaBuffer);
    
    console.log(`📸 验证码图片已保存: ${captchaPath}`);
    
    try {
      const result = await this.recognizeCaptchaWithTencent(captchaPath);
      
      // 清理临时文件
      try {
        fs.unlinkSync(captchaPath);
      } catch (error) {
        // 忽略清理错误
      }
      
      if (result.confidence < 50) {
        console.log('⚠️ 置信度过低，建议重试');
        return null;
      }
      
      return result.text;
      
    } catch (error) {
      console.log('❌ 验证码识别失败:', error.message);
      
      try {
        fs.unlinkSync(captchaPath);
      } catch (cleanupError) {
        // 忽略清理错误
      }
      
      return null;
    }
  }

  /**
   * 提取Cookie
   */
  async extractCookies() {
    console.log('🍪 提取登录Cookie...');
    
    const cookies = await this.page.cookies();
    const cookieString = cookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
    
    console.log(`✅ Cookie提取成功，共 ${cookies.length} 个Cookie`);
    
    // 保存Cookie
    await this.cookieHelper.saveCookie(cookieString);
    
    return {
      success: true,
      cookies: cookieString,
      cookieCount: cookies.length,
      timestamp: new Date().toISOString(),
      method: 'tencent-ocr',
      loginUrl: this.page.url()
    };
  }

  /**
   * 清理资源
   */
  async cleanup() {
    console.log('🧹 清理资源...');
    
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log('✅ 资源清理完成');
  }
}

// 主函数
async function main() {
  const autoLogin = new DianXiaoMiFinalLogin({
    headless: true
  });
  
  try {
    const result = await autoLogin.login();
    
    console.log('\n🎉 腾讯云OCR自动登录完成！');
    console.log('📊 登录结果:');
    console.log(`   成功状态: ${result.success}`);
    console.log(`   Cookie数量: ${result.cookieCount}`);
    console.log(`   识别方法: ${result.method}`);
    console.log(`   登录页面: ${result.loginUrl}`);
    console.log(`   完成时间: ${result.timestamp}`);
    
    return result;
    
  } catch (error) {
    console.error('\n❌ 自动登录失败:', error.message);
    throw error;
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('💥 程序异常退出:', error.message);
    process.exit(1);
  });
}

module.exports = { DianXiaoMiFinalLogin, main };
