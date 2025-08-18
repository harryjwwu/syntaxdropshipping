const mysql = require('mysql2/promise');
require('dotenv').config();

async function addSampleDiscountRules() {
  let connection;
  
  try {
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'syntaxdropshipping',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ 数据库连接成功');

    // 检查是否有已绑定店小秘的用户
    const [users] = await connection.execute(
      'SELECT id, email, dxm_client_id FROM users WHERE dxm_client_id IS NOT NULL LIMIT 3'
    );

    if (users.length === 0) {
      console.log('❌ 没有找到已绑定店小秘的用户');
      return;
    }

    console.log(`📋 找到 ${users.length} 个已绑定店小秘的用户`);

    // 为每个用户添加示例折扣规则
    for (const user of users) {
      console.log(`\n👤 为用户 ${user.email} (DXM ID: ${user.dxm_client_id}) 添加折扣规则...`);
      
      // 检查是否已有折扣规则
      const [existingRules] = await connection.execute(
        'SELECT COUNT(*) as count FROM user_discount_rules WHERE dxm_client_id = ?',
        [user.dxm_client_id]
      );

      if (existingRules[0].count > 0) {
        console.log(`  ⚠️ 该用户已有 ${existingRules[0].count} 条折扣规则，跳过`);
        continue;
      }

      // 添加示例折扣规则
      const sampleRules = [
        { min_quantity: 1, max_quantity: 3, discount_rate: 0.90 }, // 1-3件9折
        { min_quantity: 4, max_quantity: 8, discount_rate: 0.85 }, // 4-8件8.5折
        { min_quantity: 9, max_quantity: 15, discount_rate: 0.80 }, // 9-15件8折
        { min_quantity: 16, max_quantity: 999, discount_rate: 0.75 } // 16件以上7.5折
      ];

      for (const rule of sampleRules) {
        try {
          await connection.execute(
            `INSERT INTO user_discount_rules (dxm_client_id, min_quantity, max_quantity, discount_rate)
             VALUES (?, ?, ?, ?)`,
            [user.dxm_client_id, rule.min_quantity, rule.max_quantity, rule.discount_rate]
          );
          
          const discountDisplay = (rule.discount_rate * 10).toFixed(1) + '折';
          console.log(`  ✅ ${rule.min_quantity}-${rule.max_quantity}件 ${discountDisplay}`);
        } catch (error) {
          console.log(`  ❌ 规则添加失败: ${error.message}`);
        }
      }
    }

    // 显示最终统计
    const [totalRules] = await connection.execute(
      'SELECT COUNT(*) as total FROM user_discount_rules'
    );
    
    console.log(`\n📊 总计: ${totalRules[0].total} 条折扣规则`);

    console.log('\n🎉 示例折扣规则添加完成！');

  } catch (error) {
    console.error('❌ 添加示例数据时发生错误:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 执行脚本
if (require.main === module) {
  addSampleDiscountRules()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { addSampleDiscountRules };
