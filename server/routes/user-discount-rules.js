const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/adminAuth');
const { getConnection } = require('../config/database');

// 获取指定用户的折扣规则
router.get('/:dxmClientId', authenticateAdmin, async (req, res) => {
  try {
    const { dxmClientId } = req.params;
    
    if (!dxmClientId || isNaN(dxmClientId)) {
      return res.status(400).json({ error: '无效的客户ID' });
    }

    const connection = await getConnection();
    
    const [rules] = await connection.execute(
      `SELECT id, dxm_client_id, min_quantity, max_quantity, discount_rate, 
              created_at, updated_at 
       FROM user_discount_rules 
       WHERE dxm_client_id = ? 
       ORDER BY min_quantity ASC`,
      [parseInt(dxmClientId)]
    );

    res.json({
      success: true,
      data: rules,
      total: rules.length
    });

  } catch (error) {
    console.error('获取折扣规则失败:', error);
    res.status(500).json({ error: '获取折扣规则失败' });
  }
});

// 创建折扣规则
router.post('/:dxmClientId', authenticateAdmin, async (req, res) => {
  try {
    const { dxmClientId } = req.params;
    const { min_quantity, max_quantity, discount_rate } = req.body;
    
    // 参数验证
    if (!dxmClientId || isNaN(dxmClientId)) {
      return res.status(400).json({ error: '无效的客户ID' });
    }

    if (!min_quantity || !max_quantity || !discount_rate) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    if (min_quantity < 1 || max_quantity < 1 || min_quantity > max_quantity) {
      return res.status(400).json({ error: '数量范围无效' });
    }

    if (discount_rate <= 0 || discount_rate > 1) {
      return res.status(400).json({ error: '折扣率必须在0-1之间' });
    }

    const connection = await getConnection();

    // 检查用户是否存在且已绑定店小秘
    const [users] = await connection.execute(
      'SELECT id, dxm_client_id FROM users WHERE dxm_client_id = ?',
      [parseInt(dxmClientId)]
    );

    if (users.length === 0) {
      
      return res.status(404).json({ error: '用户不存在或未绑定店小秘' });
    }

    // 检查数量范围是否与现有规则冲突
    const [conflictRules] = await connection.execute(
      `SELECT id FROM user_discount_rules 
       WHERE dxm_client_id = ? 
       AND ((min_quantity <= ? AND max_quantity >= ?) 
            OR (min_quantity <= ? AND max_quantity >= ?)
            OR (min_quantity >= ? AND max_quantity <= ?))`,
      [
        parseInt(dxmClientId),
        parseInt(min_quantity), parseInt(min_quantity),
        parseInt(max_quantity), parseInt(max_quantity),
        parseInt(min_quantity), parseInt(max_quantity)
      ]
    );

    if (conflictRules.length > 0) {
      
      return res.status(400).json({ error: '数量范围与现有规则冲突' });
    }

    // 创建折扣规则
    const [result] = await connection.execute(
      `INSERT INTO user_discount_rules (dxm_client_id, min_quantity, max_quantity, discount_rate)
       VALUES (?, ?, ?, ?)`,
      [parseInt(dxmClientId), parseInt(min_quantity), parseInt(max_quantity), parseFloat(discount_rate)]
    );

    // 获取创建的规则详情
    const [newRule] = await connection.execute(
      `SELECT id, dxm_client_id, min_quantity, max_quantity, discount_rate, 
              created_at, updated_at 
       FROM user_discount_rules 
       WHERE id = ?`,
      [result.insertId]
    );

    

    res.status(201).json({
      success: true,
      message: '折扣规则创建成功',
      data: newRule[0]
    });

  } catch (error) {
    console.error('创建折扣规则失败:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: '数量范围重复' });
    } else {
      res.status(500).json({ error: '创建折扣规则失败' });
    }
  }
});

// 更新折扣规则
router.put('/:dxmClientId/:ruleId', authenticateAdmin, async (req, res) => {
  try {
    const { dxmClientId, ruleId } = req.params;
    const { min_quantity, max_quantity, discount_rate } = req.body;
    
    // 参数验证
    if (!dxmClientId || isNaN(dxmClientId) || !ruleId || isNaN(ruleId)) {
      return res.status(400).json({ error: '无效的参数' });
    }

    if (!min_quantity || !max_quantity || !discount_rate) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    if (min_quantity < 1 || max_quantity < 1 || min_quantity > max_quantity) {
      return res.status(400).json({ error: '数量范围无效' });
    }

    if (discount_rate <= 0 || discount_rate > 1) {
      return res.status(400).json({ error: '折扣率必须在0-1之间' });
    }

    const connection = await getConnection();

    // 检查规则是否存在
    const [existingRules] = await connection.execute(
      'SELECT id FROM user_discount_rules WHERE id = ? AND dxm_client_id = ?',
      [parseInt(ruleId), parseInt(dxmClientId)]
    );

    if (existingRules.length === 0) {
      
      return res.status(404).json({ error: '折扣规则不存在' });
    }

    // 检查数量范围是否与其他规则冲突（排除当前规则）
    const [conflictRules] = await connection.execute(
      `SELECT id FROM user_discount_rules 
       WHERE dxm_client_id = ? AND id != ?
       AND ((min_quantity <= ? AND max_quantity >= ?) 
            OR (min_quantity <= ? AND max_quantity >= ?)
            OR (min_quantity >= ? AND max_quantity <= ?))`,
      [
        parseInt(dxmClientId), parseInt(ruleId),
        parseInt(min_quantity), parseInt(min_quantity),
        parseInt(max_quantity), parseInt(max_quantity),
        parseInt(min_quantity), parseInt(max_quantity)
      ]
    );

    if (conflictRules.length > 0) {
      
      return res.status(400).json({ error: '数量范围与现有规则冲突' });
    }

    // 更新折扣规则
    await connection.execute(
      `UPDATE user_discount_rules 
       SET min_quantity = ?, max_quantity = ?, discount_rate = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND dxm_client_id = ?`,
      [parseInt(min_quantity), parseInt(max_quantity), parseFloat(discount_rate), parseInt(ruleId), parseInt(dxmClientId)]
    );

    // 获取更新后的规则详情
    const [updatedRule] = await connection.execute(
      `SELECT id, dxm_client_id, min_quantity, max_quantity, discount_rate, 
              created_at, updated_at 
       FROM user_discount_rules 
       WHERE id = ?`,
      [parseInt(ruleId)]
    );

    

    res.json({
      success: true,
      message: '折扣规则更新成功',
      data: updatedRule[0]
    });

  } catch (error) {
    console.error('更新折扣规则失败:', error);
    res.status(500).json({ error: '更新折扣规则失败' });
  }
});

// 删除折扣规则
router.delete('/:dxmClientId/:ruleId', authenticateAdmin, async (req, res) => {
  try {
    const { dxmClientId, ruleId } = req.params;
    
    if (!dxmClientId || isNaN(dxmClientId) || !ruleId || isNaN(ruleId)) {
      return res.status(400).json({ error: '无效的参数' });
    }

    const connection = await getConnection();

    // 检查规则是否存在
    const [existingRules] = await connection.execute(
      'SELECT id FROM user_discount_rules WHERE id = ? AND dxm_client_id = ?',
      [parseInt(ruleId), parseInt(dxmClientId)]
    );

    if (existingRules.length === 0) {
      
      return res.status(404).json({ error: '折扣规则不存在' });
    }

    // 删除折扣规则
    await connection.execute(
      'DELETE FROM user_discount_rules WHERE id = ? AND dxm_client_id = ?',
      [parseInt(ruleId), parseInt(dxmClientId)]
    );

    

    res.json({
      success: true,
      message: '折扣规则删除成功'
    });

  } catch (error) {
    console.error('删除折扣规则失败:', error);
    res.status(500).json({ error: '删除折扣规则失败' });
  }
});

// 批量删除折扣规则
router.delete('/:dxmClientId', authenticateAdmin, async (req, res) => {
  try {
    const { dxmClientId } = req.params;
    
    if (!dxmClientId || isNaN(dxmClientId)) {
      return res.status(400).json({ error: '无效的客户ID' });
    }

    const connection = await getConnection();

    // 删除用户的所有折扣规则
    const [result] = await connection.execute(
      'DELETE FROM user_discount_rules WHERE dxm_client_id = ?',
      [parseInt(dxmClientId)]
    );

    

    res.json({
      success: true,
      message: `成功删除 ${result.affectedRows} 条折扣规则`
    });

  } catch (error) {
    console.error('批量删除折扣规则失败:', error);
    res.status(500).json({ error: '批量删除折扣规则失败' });
  }
});

module.exports = router;
