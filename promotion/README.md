# 🚀 Syntax Dropshipping - 欧洲Shopify推广系统

专门用于发现欧洲Shopify独立站并提取全方位联系方式的自动化推广系统。

## ✨ 主要功能

### 🔍 网站发现
- **Shopify官方展示爬取**: 从官方showcase获取高质量网站
- **搜索引擎发现**: 通过Google搜索发现更多网站 (需要API)
- **智能验证**: 自动验证Shopify技术栈和欧洲地区
- **多维度分析**: 按国家、类别、语言分类

### 📞 联系方式提取
- **📧 邮箱提取**: 智能提取并分类商务邮箱
- **📱 WhatsApp发现**: 提取WhatsApp号码和链接
- **☎️ 电话号码**: 提取各种格式的电话号码
- **💬 即时通讯**: Telegram、Skype等
- **🌐 社交媒体**: Instagram、Facebook、LinkedIn、Twitter
- **🎯 多语言支持**: 支持德语、法语、意大利语、西班牙语等

### 📊 数据管理
- **MySQL数据库**: 完整的数据存储和管理
- **智能去重**: 自动去除重复联系方式
- **质量评分**: 对联系方式进行质量评估
- **详细报告**: 生成JSON和可视化报告

## 🚀 快速开始

### 1. 环境准备
```bash
# 安装依赖
npm install

# 设置环境变量
cp config/env.example config/.env
# 编辑 config/.env 配置数据库连接

# 初始化数据库
npm run setup-db
```

### 2. 基本使用
```bash
# 完整流程 (推荐)
node index.js full-process 100

# 或分步执行
node index.js discover 200      # 发现网站
node index.js extract 50        # 提取联系方式

# 查看帮助
node index.js help
```

### 3. 快速脚本
```bash
# 仅发现网站
npm run discover

# 仅提取联系方式  
npm run extract-emails

# 完整流程
npm start
```

## 📋 系统要求

### 必需
- **Node.js** 14+
- **MySQL** 5.7+ 或 8.0+
- **网络连接** (稳定的国际网络)

### 可选 (提升效果)
- **SerpAPI Key** - Google搜索发现
- **Hunter.io API** - 邮箱验证
- **代理服务** - 避免IP限制

## 🗃️ 数据库结构

```sql
discovered_websites     # 发现的网站
├── url, domain, platform
├── country_code, language
├── title, description, category
└── tech_stack, discovery_method

extracted_emails        # 提取的邮箱
├── website_id, email, email_type
├── verification_status, score
└── is_business_email, deliverability

contact_persons         # 联系人信息
├── website_id, phone, social_media
├── whatsapp, telegram, skype
└── confidence_score
```

## 📊 预期结果

### 网站发现
- **100-500个** 验证的Shopify独立站
- **覆盖12个** 欧洲主要国家
- **按行业分类**: 时尚、电子、美容、家居等

### 联系方式提取
- **60-80%** 的网站能找到至少一种联系方式
- **平均每站2-4个** 联系方式
- **优先级**: WhatsApp > 商务邮箱 > 电话 > 社交媒体

## 🎯 目标市场

### 🌍 覆盖国家
- 🇩🇪 **德国** - 欧洲最大电商市场
- 🇬🇧 **英国** - 成熟电商生态
- 🇫🇷 **法国** - 时尚和奢侈品
- 🇮🇹 **意大利** - 手工艺和设计
- 🇪🇸 **西班牙** - 快速增长市场
- 🇳🇱 **荷兰** - 高度数字化
- 🇧🇪 **比利时** - 欧盟中心
- 🇦🇹 **奥地利** - 德语市场
- 🇨🇭 **瑞士** - 高端市场
- 🇸🇪 **瑞典** - 北欧创新
- 🇩🇰 **丹麦** - 设计导向
- 🇳🇴 **挪威** - 高消费能力

### 📂 重点行业
- **Fashion & Apparel** - 时尚服装
- **Electronics & Gadgets** - 电子产品
- **Health & Beauty** - 健康美容
- **Home & Garden** - 家居园艺
- **Jewelry & Accessories** - 珠宝配饰
- **Sports & Fitness** - 运动健身

## 🔧 配置选项

### config/.env 主要配置
```bash
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=syntaxdropshipping_promotion

# 爬虫配置
REQUEST_DELAY=2000        # 请求间隔(毫秒)
MAX_CONCURRENT=5          # 最大并发数
USER_AGENT=Mozilla/5.0... # 用户代理

# API配置 (可选)
SERPAPI_KEY=your_key      # Google搜索
HUNTER_API_KEY=your_key   # 邮箱验证
```

### 性能调优
```javascript
// 调整请求频率
REQUEST_DELAY=1000        # 更快但风险高
REQUEST_DELAY=5000        # 更稳定但较慢

// 并发控制
MAX_CONCURRENT=3          # 保守设置
MAX_CONCURRENT=10         # 激进设置
```

## 📈 使用场景

### 1. 市场调研
```bash
# 发现特定国家的网站
node index.js discover 500
# 分析竞争对手和市场规模
```

### 2. 销售线索
```bash
# 提取联系方式用于销售
node index.js extract 100
# 重点关注WhatsApp和商务邮箱
```

### 3. 合作伙伴开发
```bash
# 完整流程寻找潜在合作伙伴
node index.js full-process 200
# 按行业和规模筛选目标
```

## 🛡️ 合规性

### GDPR合规
- ✅ 仅收集公开信息
- ✅ 提供数据删除功能
- ✅ 明确数据使用目的
- ✅ 尊重robots.txt规则

### 最佳实践
- 🚦 控制请求频率
- 🎯 只针对相关业务
- 📧 首次联系说明来源
- ❌ 避免垃圾信息发送

## 📞 联系方式类型优先级

### 1. 🥇 WhatsApp (最高优先级)
- 即时响应
- 直接沟通
- 全球通用

### 2. 🥈 商务邮箱
- info@, contact@, sales@
- 正式商务沟通
- 详细资料发送

### 3. 🥉 电话号码
- 直接通话
- 紧急联系
- 建立信任

### 4. 📱 社交媒体
- 了解公司文化
- 非正式接触
- 关系建立

## 🔍 故障排除

### 常见问题

**Q: 发现的网站数量少?**
```bash
# 检查网络连接
curl -I https://www.shopify.com/examples

# 增加发现源
# 配置SerpAPI key获得更多结果
```

**Q: 联系方式提取失败?**
```bash
# 检查数据库连接
mysql -u root -p syntaxdropshipping_promotion

# 降低并发数
# 在.env中设置 MAX_CONCURRENT=2
```

**Q: 请求被阻止?**
```bash
# 增加延迟时间
# REQUEST_DELAY=5000

# 使用代理服务
# 配置PROXY_HOST和PROXY_PORT
```

### 日志调试
```bash
# 查看详细日志
DEBUG=* node index.js discover

# 检查数据库状态
node database/setup.js
```

## 📊 报告示例

### 发现报告
```json
{
  "discoveryDate": "2024-01-15T10:30:00.000Z",
  "totalSites": 234,
  "byCountry": {
    "Germany": 89,
    "France": 45,
    "Italy": 32,
    "Spain": 28,
    "Netherlands": 25,
    "United Kingdom": 15
  },
  "byCategory": {
    "fashion": 78,
    "electronics": 45,
    "beauty": 34,
    "home": 28,
    "jewelry": 25,
    "sports": 24
  }
}
```

### 联系方式报告
```json
{
  "extractionDate": "2024-01-15T12:00:00.000Z",
  "totalProcessed": 150,
  "withContacts": 127,
  "successRate": "84.7%",
  "contactMethods": {
    "emails": 145,
    "whatsapp": 89,
    "phones": 67,
    "social": 234
  }
}
```

## 🚀 高级功能

### 自定义过滤器
```javascript
// 在代码中添加自定义过滤逻辑
const customFilter = (website) => {
  // 只处理特定类别
  return website.category === 'fashion';
  
  // 或特定国家
  return website.country_code === 'DE';
  
  // 或组合条件
  return website.category === 'electronics' && 
         ['DE', 'FR', 'IT'].includes(website.country_code);
};
```

### 批量处理
```bash
# 大批量处理
for i in {1..5}; do
  node index.js discover 200
  sleep 3600  # 等待1小时
done
```

### 数据导出
```sql
-- 导出高质量联系方式
SELECT 
  w.url,
  w.country_name,
  w.category,
  e.email,
  cp.phone,
  cp.social_media->>'$.whatsapp[0].value' as whatsapp
FROM discovered_websites w
LEFT JOIN extracted_emails e ON w.id = e.website_id
LEFT JOIN contact_persons cp ON w.id = cp.website_id
WHERE e.is_business_email = 1 
   OR JSON_LENGTH(cp.social_media->>'$.whatsapp') > 0;
```

## 📝 更新日志

### v1.0.0 (2024-01-15)
- ✅ 基础网站发现功能
- ✅ 邮箱提取系统
- ✅ WhatsApp和电话提取
- ✅ 社交媒体发现
- ✅ MySQL数据库集成
- ✅ 多语言支持
- ✅ GDPR合规性

## 🤝 贡献

欢迎提交Issue和Pull Request来改进系统！

## 📄 许可证

MIT License - 详见LICENSE文件

---

**Syntax Dropshipping Team**  
专业的代发货和供应链解决方案









