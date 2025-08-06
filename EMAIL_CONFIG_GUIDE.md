# 📧 邮件服务配置指南

## Gmail 配置步骤

### 1. 启用两步验证
1. 访问 [Google账户设置](https://myaccount.google.com/)
2. 点击左侧 "安全" 选项
3. 找到 "登录Google" 部分
4. 点击 "两步验证" 并按提示开启

### 2. 生成应用专用密码
1. 返回Google账户的 "安全" 页面
2. 找到 "应用专用密码"
3. 点击 "生成应用专用密码"
4. 选择应用："邮件"，设备："其他（自定义名称）"
5. 输入名称如："Syntax Dropshipping"
6. 点击 "生成"
7. 复制生成的16位密码（格式类似：abcd efgh ijkl mnop）

### 3. 创建 server/.env 文件

在 `server/` 目录下创建 `.env` 文件，内容如下：

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=syntaxdropshipping
DB_PORT=3306

# Server Configuration
PORT=5001
NODE_ENV=development

# JWT Secret
JWT_SECRET=syntax_dropshipping_secret_key_2024

# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

**重要提醒：**
- 将 `your-email@gmail.com` 替换为你的真实Gmail地址
- 将 `your-app-specific-password` 替换为第2步生成的16位应用专用密码
- 应用专用密码包含空格是正常的，直接复制粘贴即可

## 其他邮件服务商配置

### QQ邮箱
```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASS=your-authorization-code
```

**QQ邮箱授权码获取：**
1. 登录QQ邮箱
2. 设置 -> 账户
3. 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
4. 开启SMTP服务，获取授权码

### 163邮箱
```env
SMTP_HOST=smtp.163.com
SMTP_PORT=587
SMTP_USER=your-email@163.com
SMTP_PASS=your-authorization-code
```

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

## 测试邮件配置

配置完成后，重启服务器，验证码邮件将正常发送。

如果遇到问题，请检查：
1. 邮箱地址和密码是否正确
2. 是否启用了两步验证（Gmail必须）
3. 是否生成了应用专用密码
4. 网络连接是否正常

## 安全提醒

⚠️ **重要安全提醒：**
- 永远不要将 `.env` 文件提交到版本控制系统
- 保护好你的应用专用密码
- 定期更换应用专用密码
- 项目已配置 `.gitignore` 忽略 `.env` 文件