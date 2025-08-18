# DianXiaoMi 安全配置说明

## ⚠️ 重要安全提醒

**绝对不要在代码中硬编码用户名和密码！**

之前的代码存在严重安全漏洞，硬编码了用户名和密码：
- ❌ `'Sara918'` (用户名)
- ❌ `'Sara112233.'` (密码)

这些敏感信息一旦提交到Git仓库，就会永久泄露！

## ✅ 正确的配置方式

### 1. 在 `.env` 文件中配置

```bash
# DianXiaoMi 店小秘登录配置
DIANXIAOMI_USERNAME=your_actual_username
DIANXIAOMI_PASSWORD=your_actual_password

# 腾讯云OCR API配置
TENCENT_SECRET_ID=your_tencent_secret_id
TENCENT_SECRET_KEY=your_tencent_secret_key
TENCENT_REGION=ap-beijing

# 默认管理员密码（可选，不设置则使用默认值）
DEFAULT_ADMIN_PASSWORD=your_secure_admin_password
```

### 2. 确保 `.env` 文件在 `.gitignore` 中

```gitignore
# 环境变量文件
.env
.env.local
.env.production
```

### 3. 代码中的安全验证

现在的代码已经添加了配置验证：
- 如果缺少必需的环境变量，程序会抛出错误
- 不再提供任何默认的用户名或密码
- 强制用户正确配置环境变量

## 🔒 安全最佳实践

1. **永远不要在代码中硬编码敏感信息**
2. **使用环境变量管理配置**
3. **确保 `.env` 文件不被提交到版本控制**
4. **定期轮换密码和API密钥**
5. **使用强密码和双因素认证**

## 🚨 已修复的安全问题

### DianXiaoMi 相关
- ✅ 移除了硬编码的用户名 `'Sara918'`
- ✅ 移除了硬编码的密码 `'Sara112233.'`
- ✅ 添加了配置验证逻辑
- ✅ 删除了包含敏感信息的cookie文件
- ✅ 强制使用环境变量配置

### 管理员密码相关
- ✅ 修复了 `server/utils/initAdmin.js` 中的硬编码密码 `'admin123456'`
- ✅ 修复了 `server/config/initDatabase.js` 中的硬编码密码 `'admin123'`
- ✅ 修复了 `server/init-data.js` 中的硬编码密码 `'admin123'`
- ✅ 添加了 `DEFAULT_ADMIN_PASSWORD` 环境变量支持
- ✅ 添加了安全警告提示
