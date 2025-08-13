# 佣金系统 (Commission System) 

## 🎯 系统概述

Syntax Dropshipping 佣金系统是一个完整的推荐返佣解决方案，支持一层推荐返佣模式，为用户提供推荐奖励机制。

### 核心特性
- ✅ **一层推荐返佣**：A推荐B，B下单后A获得2%佣金
- ✅ **推荐码系统**：自动生成唯一推荐码和推荐链接
- ✅ **冻结期管理**：15-20天冻结期，确认无退货后结算
- ✅ **提现管理**：支持多种提现方式（银行转账、PayPal、支付宝、微信）
- ✅ **自动化处理**：定时任务自动处理到期佣金
- ✅ **管理后台**：完整的管理员审核和统计功能

## 🏗️ 系统架构

### 数据库设计
```sql
-- 用户表扩展（添加推荐相关字段）
users (
  referral_code VARCHAR(50) UNIQUE,  -- 用户推荐码
  referred_by INT                    -- 推荐人ID
)

-- 推荐关系表
referral_relationships (
  referrer_id, referee_id, referral_code, status
)

-- 佣金记录表
commission_records (
  order_id, referrer_id, referee_id, 
  order_amount, commission_amount, commission_rate,
  status, freeze_until, paid_at
)

-- 佣金账户表
commission_accounts (
  user_id, total_earned, available_balance, 
  frozen_balance, total_withdrawn, total_referrals
)

-- 提现记录表
commission_withdrawals (
  user_id, withdrawal_number, amount, method, 
  account_info, status, admin_id
)

-- 佣金设置表
commission_settings (
  setting_name, setting_value, data_type, description
)
```

### 后端架构
```
server/
├── utils/
│   ├── commissionManager.js      # 佣金管理核心逻辑
│   └── commissionCronJob.js      # 定时任务处理
├── routes/
│   ├── commission.js             # 佣金API路由
│   ├── orders.js                 # 订单API路由（集成佣金）
│   └── auth.js                   # 认证路由（集成推荐码）
└── config/
    └── database-schema.sql       # 数据库结构
```

### 前端架构
```
client/src/
├── pages/
│   ├── CommissionPage.js         # 佣金中心页面
│   └── RegisterPage.js           # 注册页面（支持推荐码）
├── components/
│   └── Navbar.js                 # 导航栏（佣金中心入口）
└── utils/
    └── api.js                    # API接口配置
```

## 📋 API 接口

### 用户端接口

#### 获取推荐码
```
GET /api/commission/referral-code
Response: { referralCode, referralLink }
```

#### 获取佣金账户
```
GET /api/commission/account
Response: { total_earned, available_balance, frozen_balance, ... }
```

#### 获取佣金记录
```
GET /api/commission/records?page=1&limit=20
Response: { records, pagination }
```

#### 获取推荐统计
```
GET /api/commission/referral-stats
Response: { referrals, commissionStats }
```

#### 申请提现
```
POST /api/commission/withdrawal
Body: { amount, method, accountInfo }
```

#### 获取提现记录
```
GET /api/commission/withdrawals?page=1&limit=20
Response: { withdrawals, pagination }
```

### 管理员接口

#### 获取所有佣金记录
```
GET /api/commission/admin/records?page=1&limit=20&status=frozen
```

#### 获取所有提现申请
```
GET /api/commission/admin/withdrawals?page=1&limit=20&status=pending
```

#### 处理提现申请
```
PUT /api/commission/admin/withdrawals/:id
Body: { status, adminNotes }
```

### 订单系统集成

#### 创建订单
```
POST /api/orders
Body: { items, shippingAddress, billingAddress, ... }
```

#### 更新订单状态（触发佣金计算）
```
PUT /api/orders/:id/status
Body: { status: 'processing', trackingNumber, notes }
```

## 🔄 业务流程

### 1. 推荐注册流程
```
用户A生成推荐链接 → 用户B通过链接注册 → 系统建立推荐关系 → 为用户B分配推荐码
```

### 2. 佣金产生流程
```
用户B下单 → 订单付款成功 → 管理员更新订单状态为processing → 
系统自动计算佣金 → 佣金进入冻结状态（15-20天）
```

### 3. 佣金结算流程
```
定时任务检查冻结期 → 冻结期到期 → 佣金状态变更为available → 
用户可申请提现 → 管理员审核 → 提现完成
```

### 4. 提现处理流程
```
用户申请提现 → 系统验证余额 → 冻结提现金额 → 管理员审核 → 
审核通过：完成提现，更新账户 / 审核拒绝：退还金额到可用余额
```

## ⚙️ 配置说明

### 默认配置
- **佣金比例**: 2% (可配置)
- **冻结期**: 15天 (可配置)
- **最小提现金额**: $10 (可配置)
- **最大单次提现**: $10,000 (可配置)
- **提现手续费**: 0% (可配置)

### 推荐码规则
- **格式**: `SYN{用户哈希}{时间戳}`
- **示例**: `SYNAB1234567890`
- **特点**: 唯一性、可追溯性

## 🔧 定时任务

### 佣金处理任务
- **频率**: 每小时执行一次
- **功能**: 处理冻结期到期的佣金记录
- **状态变更**: `frozen` → `available`

### 统计更新任务
- **频率**: 每天凌晨2点执行
- **功能**: 更新活跃推荐人数量等统计信息

## 📊 前端功能

### 佣金中心页面
1. **概览标签页**
   - 佣金账户概览卡片
   - 最近佣金记录
   - 推荐统计信息

2. **推荐管理标签页**
   - 推荐链接生成和复制
   - 推荐用户列表
   - 推荐统计

3. **佣金记录标签页**
   - 佣金记录列表
   - 状态筛选
   - 分页显示

4. **提现记录标签页**
   - 提现申请功能
   - 提现记录列表
   - 状态跟踪

### 注册页面增强
- 推荐码输入字段
- 推荐码验证
- 推荐人信息显示
- URL参数自动填充

## 🚀 部署说明

### 数据库迁移
```bash
# 执行数据库结构更新
npm run init-db
```

### 安装依赖
```bash
# 安装新增依赖
npm install node-cron
```

### 启动服务
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

## 🧪 测试

### 运行佣金系统测试
```bash
node test-commission-system.js
```

### 功能测试清单
- [ ] 推荐码生成和验证
- [ ] 推荐关系建立
- [ ] 佣金计算和记录
- [ ] 冻结期处理
- [ ] 提现申请和审核
- [ ] 定时任务执行
- [ ] 前端页面功能

## 📈 监控和维护

### 关键指标监控
- 推荐转化率
- 佣金发放金额
- 提现处理时间
- 系统错误率

### 日常维护
- 定期检查定时任务执行状态
- 监控佣金账户余额准确性
- 审核异常提现申请
- 更新佣金设置参数

## 🔒 安全考虑

### 数据安全
- 推荐关系防篡改
- 佣金金额完整性校验
- 提现信息加密存储

### 业务安全
- 防止恶意刷推荐
- 提现金额合理性验证
- 管理员权限控制

## 📝 更新日志

### v1.0.0 (2024-12-19)
- ✅ 完整的佣金系统架构
- ✅ 推荐码和推荐关系管理
- ✅ 佣金计算和冻结期处理
- ✅ 提现申请和管理员审核
- ✅ 前端佣金中心页面
- ✅ 定时任务自动化处理
- ✅ 完整的API接口文档

---

## 🤝 贡献

如需对佣金系统进行修改或扩展，请遵循以下原则：
1. 保持数据一致性
2. 确保事务完整性
3. 添加适当的错误处理
4. 更新相关文档
5. 进行充分测试

## 📞 支持

如有问题或建议，请联系开发团队：
- 邮箱: info@syntaxdropshipping.com
- 电话: +86 135 7070 5010