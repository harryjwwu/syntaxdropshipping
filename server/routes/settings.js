const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const { authenticateAdmin } = require('../middleware/adminAuth');
const { authenticateUser } = require('../middleware/auth');

// ==================== 获取系统设置 ====================

// 获取所有系统设置
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { type } = req.query;
    
    let query = 'SELECT * FROM system_settings WHERE is_active = 1';
    let params = [];
    
    if (type) {
      query += ' AND setting_type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY setting_type, setting_key';
    
    const connection = await getConnection();
    const [settings] = await connection.execute(query, params);
    
    // 解析JSON格式的设置值
    const parsedSettings = settings.map(setting => ({
      ...setting,
      setting_value: setting.setting_value ? JSON.parse(setting.setting_value) : null
    }));
    
    res.json({
      success: true,
      data: parsedSettings
    });
  } catch (error) {
    console.error('获取系统设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统设置失败'
    });
  }
});

// 获取单个系统设置
router.get('/:key', authenticateAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    
    const connection = await getConnection();
    const [settings] = await connection.execute(
      'SELECT * FROM system_settings WHERE setting_key = ? AND is_active = 1',
      [key]
    );
    
    if (settings.length === 0) {
      return res.status(404).json({
        success: false,
        message: '设置项不存在'
      });
    }
    
    const setting = settings[0];
    setting.setting_value = setting.setting_value ? JSON.parse(setting.setting_value) : null;
    
    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('获取系统设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统设置失败'
    });
  }
});

// ==================== 更新系统设置 ====================

// 更新系统设置
router.put('/:key', authenticateAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { setting_value, description } = req.body;
    
    if (!setting_value) {
      return res.status(400).json({
        success: false,
        message: '设置值不能为空'
      });
    }
    
    const connection = await getConnection();
    
    // 检查设置项是否存在
    const [existingSettings] = await connection.execute(
      'SELECT id FROM system_settings WHERE setting_key = ?',
      [key]
    );
    
    if (existingSettings.length === 0) {
      return res.status(404).json({
        success: false,
        message: '设置项不存在'
      });
    }
    
    // 更新设置
    const settingValueJson = JSON.stringify(setting_value);
    const updateFields = ['setting_value = ?'];
    const updateParams = [settingValueJson];
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(description);
    }
    
    updateParams.push(key);
    
    await connection.execute(
      `UPDATE system_settings SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?`,
      updateParams
    );
    
    // 获取更新后的设置
    const [updatedSettings] = await connection.execute(
      'SELECT * FROM system_settings WHERE setting_key = ?',
      [key]
    );
    
    const updatedSetting = updatedSettings[0];
    updatedSetting.setting_value = JSON.parse(updatedSetting.setting_value);
    
    res.json({
      success: true,
      message: '系统设置更新成功',
      data: updatedSetting
    });
  } catch (error) {
    console.error('更新系统设置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新系统设置失败'
    });
  }
});

// ==================== 支付信息相关API ====================

// 获取所有支付信息设置
router.get('/payment/info', authenticateAdmin, async (req, res) => {
  try {
    const connection = await getConnection();
    const [settings] = await connection.execute(
      'SELECT * FROM system_settings WHERE (setting_type = ? OR setting_key = ? OR setting_key = ?) AND is_active = 1 ORDER BY setting_key',
      ['payment_info', 'others_currency_tooltip', 'commission_rules']
    );
    
    const paymentInfo = {};
    settings.forEach(setting => {
      paymentInfo[setting.setting_key] = {
        ...setting,
        setting_value: setting.setting_value ? JSON.parse(setting.setting_value) : null
      };
    });
    
    res.json({
      success: true,
      data: paymentInfo
    });
  } catch (error) {
    console.error('获取支付信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取支付信息失败'
    });
  }
});

// 更新支付信息设置
router.put('/payment/:type', authenticateAdmin, async (req, res) => {
  try {
    const { type } = req.params; // usd_bank_transfer, eur_bank_transfer, paypal, others_currency_tooltip, commission_rules
    const paymentInfo = req.body;
    
    // 处理特殊的设置项
    let settingKey;
    if (type === 'others_currency_tooltip') {
      settingKey = 'others_currency_tooltip';
    } else if (type === 'commission_rules') {
      settingKey = 'commission_rules';
    } else {
      settingKey = `payment_${type}`;
    }
    
    const connection = await getConnection();
    
    // 检查设置项是否存在
    const [existingSettings] = await connection.execute(
      'SELECT id FROM system_settings WHERE setting_key = ?',
      [settingKey]
    );
    
    if (existingSettings.length === 0) {
      return res.status(404).json({
        success: false,
        message: '设置项不存在'
      });
    }
    
    // 更新设置信息
    const settingValueJson = JSON.stringify(paymentInfo);
    
    await connection.execute(
      'UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
      [settingValueJson, settingKey]
    );
    
    // 获取更新后的设置
    const [updatedSettings] = await connection.execute(
      'SELECT * FROM system_settings WHERE setting_key = ?',
      [settingKey]
    );
    
    const updatedSetting = updatedSettings[0];
    updatedSetting.setting_value = JSON.parse(updatedSetting.setting_value);
    
    res.json({
      success: true,
      message: '设置更新成功',
      data: updatedSetting
    });
  } catch (error) {
    console.error('更新设置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新设置失败'
    });
  }
});

// ==================== 公共API (无需认证) ====================

// 获取佣金规则设置 (公共API，供客户端使用)
router.get('/commission/rules', async (req, res) => {
  try {
    const connection = await getConnection();
    const [settings] = await connection.execute(
      'SELECT setting_value FROM system_settings WHERE setting_key = ? AND is_active = 1 LIMIT 1',
      ['commission_rules']
    );

    if (settings.length === 0) {
      return res.json({
        success: true,
        data: {
          first_level_rate: 2.0,
          description: '只支持一层推荐返佣：一级返佣 2%\nA 推荐 B → B 下单后支付金额的 2% 给 A\nB 推荐 C → C 下单后支付金额的 2% 给 B，C的付款金额不与A关联',
          is_enabled: true
        }
      });
    }

    const commissionRules = JSON.parse(settings[0].setting_value);

    res.json({
      success: true,
      data: commissionRules
    });
  } catch (error) {
    console.error('获取佣金规则失败:', error);
    res.status(500).json({
      success: false,
      message: '获取佣金规则失败'
    });
  }
});

module.exports = router;
