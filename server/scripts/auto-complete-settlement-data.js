#!/usr/bin/env node

/**
 * 自动补全结算数据脚本
 * 根据指定客户的订单数据，自动创建SPU、SKU-SPU映射关系、SPU价格和用户折扣规则
 * 
 * 使用方法：
 * node auto-complete-settlement-data.js <dxm_client_id>
 * 
 * 例如：
 * node auto-complete-settlement-data.js 7180831
 */

const { getConnection } = require('../config/database');
require('dotenv').config();

class SettlementDataCompleter {
  constructor() {
    this.tableCount = 10; // 订单分表数量
  }

  /**
   * 获取所有分表名称
   */
  getAllOrderTableNames() {
    const tables = [];
    for (let i = 0; i < this.tableCount; i++) {
      tables.push(`orders_${i}`);
    }
    return tables;
  }

  /**
   * 分析客户订单数据 - 包括所有状态的订单以确保完整补全
   */
  async analyzeClientOrders(connection, dxmClientId) {
    console.log(`🔍 分析客户 ${dxmClientId} 的所有订单数据...`);
    
    const orderAnalysis = {
      totalOrders: 0,
      skuInfo: new Map(), // SKU -> {name, count, countries, quantities}
      countryStats: new Map(), // country -> count
      quantityStats: new Map(), // quantity -> count
      dateRange: { start: null, end: null }
    };

    const tables = this.getAllOrderTableNames();
    
    for (const tableName of tables) {
      try {
        // 查询该客户的所有订单，包括数量信息
        const [rows] = await connection.execute(`
          SELECT product_sku, product_name, country_code, product_count, COUNT(*) as order_count
          FROM ${tableName}
          WHERE dxm_client_id = ?
          GROUP BY product_sku, product_name, country_code, product_count
          ORDER BY order_count DESC
        `, [dxmClientId]);

        for (const row of rows) {
          orderAnalysis.totalOrders += row.order_count;
          
          // SKU信息统计
          const skuKey = row.product_sku;
          if (!orderAnalysis.skuInfo.has(skuKey)) {
            orderAnalysis.skuInfo.set(skuKey, {
              name: row.product_name,
              totalCount: 0,
              countries: new Set(),
              quantities: new Set()
            });
          }
          
          const skuData = orderAnalysis.skuInfo.get(skuKey);
          skuData.totalCount += row.order_count;
          skuData.countries.add(row.country_code);
          skuData.quantities.add(row.product_count);
          
          // 国家统计
          if (!orderAnalysis.countryStats.has(row.country_code)) {
            orderAnalysis.countryStats.set(row.country_code, 0);
          }
          orderAnalysis.countryStats.set(row.country_code, 
            orderAnalysis.countryStats.get(row.country_code) + row.order_count);
          
          // 数量统计
          if (!orderAnalysis.quantityStats.has(row.product_count)) {
            orderAnalysis.quantityStats.set(row.product_count, 0);
          }
          orderAnalysis.quantityStats.set(row.product_count,
            orderAnalysis.quantityStats.get(row.product_count) + row.order_count);
        }
      } catch (error) {
        console.warn(`⚠️ 查询表 ${tableName} 时出错:`, error.message);
      }
    }

    // 获取日期范围
    try {
      // 从所有表中查询日期范围
      let minDate = null, maxDate = null;
      
      for (const tableName of tables) {
        try {
          const [dateRows] = await connection.execute(`
            SELECT MIN(payment_time) as start_date, MAX(payment_time) as end_date
            FROM ${tableName} 
            WHERE dxm_client_id = ?
          `, [dxmClientId]);
          
          if (dateRows.length > 0 && dateRows[0].start_date) {
            if (!minDate || dateRows[0].start_date < minDate) {
              minDate = dateRows[0].start_date;
            }
            if (!maxDate || dateRows[0].end_date > maxDate) {
              maxDate = dateRows[0].end_date;
            }
          }
        } catch (error) {
          // 忽略单表错误
        }
      }
      
      orderAnalysis.dateRange.start = minDate;
      orderAnalysis.dateRange.end = maxDate;
    } catch (error) {
      console.warn('⚠️ 获取日期范围时出错:', error.message);
    }

    return orderAnalysis;
  }

  /**
   * 生成SPU名称
   */
  generateSpuFromSku(sku, productName) {
    // 根据SKU前缀生成SPU
    const prefix = sku.substring(0, 5); // 取前5位作为基础
    
    if (productName.toLowerCase().includes('charm')) {
      return `CHARM-${prefix}`;
    } else if (productName.toLowerCase().includes('bag')) {
      return `BAG-${prefix}`;
    } else if (productName.toLowerCase().includes('tote')) {
      return `TOTE-${prefix}`;
    } else {
      return `PROD-${prefix}`;
    }
  }

  /**
   * 创建SPU
   */
  async createSpus(connection, skuInfo) {
    console.log(`📦 创建SPU...`);
    
    const spuMap = new Map(); // SKU -> SPU
    const spusToCreate = new Map(); // SPU -> {name, weight}
    
    // 分析并生成SPU
    for (const [sku, info] of skuInfo) {
      const spu = this.generateSpuFromSku(sku, info.name);
      spuMap.set(sku, spu);
      
      if (!spusToCreate.has(spu)) {
        // 根据产品类型设置重量
        let weight = 0.300; // 默认重量
        if (info.name.toLowerCase().includes('charm')) {
          weight = 0.050;
        } else if (info.name.toLowerCase().includes('bag')) {
          weight = 0.450;
        } else if (info.name.toLowerCase().includes('tote')) {
          weight = 0.350;
        }
        
        // 生成SPU名称（去除具体颜色等变体信息）
        let spuName = info.name
          .replace(/ - \w+$/g, '') // 去除 " - Color" 后缀
          .replace(/ \w+$/g, '') // 去除最后一个单词（通常是颜色）
          .trim();
        
        if (spuName.length < 10) {
          spuName = info.name; // 如果名称太短，使用原名称
        }
        
        spusToCreate.set(spu, { name: spuName, weight });
      }
    }
    
    // 批量创建SPU
    for (const [spu, data] of spusToCreate) {
      try {
        await connection.execute(`
          INSERT IGNORE INTO spus (spu, name, weight) 
          VALUES (?, ?, ?)
        `, [spu, data.name, data.weight]);
        
        console.log(`✅ 创建SPU: ${spu} - ${data.name}`);
      } catch (error) {
        console.error(`❌ 创建SPU ${spu} 失败:`, error.message);
      }
    }
    
    return spuMap;
  }

  /**
   * 创建SKU-SPU映射关系
   */
  async createSkuSpuMappings(connection, spuMap) {
    console.log(`🔗 创建SKU-SPU映射关系...`);
    
    for (const [sku, spu] of spuMap) {
      try {
        await connection.execute(`
          INSERT IGNORE INTO sku_spu_relations (sku, spu) 
          VALUES (?, ?)
        `, [sku, spu]);
        
        console.log(`✅ 映射关系: ${sku} -> ${spu}`);
      } catch (error) {
        console.error(`❌ 创建映射 ${sku} -> ${spu} 失败:`, error.message);
      }
    }
  }

  /**
   * 创建SPU价格
   */
  async createSpuPrices(connection, dxmClientId, spuMap, skuInfo, countryStats) {
    console.log(`💰 为客户 ${dxmClientId} 创建SPU价格...`);
    
    const uniqueSpus = new Set(spuMap.values());
    const countries = Array.from(countryStats.keys());
    
    for (const spu of uniqueSpus) {
      for (const country of countries) {
        try {
          // 根据SPU类型设置基础价格
          let productCost, shippingCost, packingCost, vatCost, totalPrice;
          
          if (spu.startsWith('CHARM-')) {
            productCost = 5.00;
            shippingCost = this.getShippingCost(country, 'charm');
            packingCost = 0.50;
            vatCost = this.getVatCost(country, 'charm');
          } else if (spu.startsWith('BAG-') || spu.startsWith('TOTE-')) {
            productCost = 15.00;
            shippingCost = this.getShippingCost(country, 'bag');
            packingCost = 1.00;
            vatCost = this.getVatCost(country, 'bag');
          } else {
            productCost = 10.00;
            shippingCost = this.getShippingCost(country, 'other');
            packingCost = 0.80;
            vatCost = this.getVatCost(country, 'other');
          }
          
          totalPrice = productCost + shippingCost + packingCost + vatCost;
          
          await connection.execute(`
            INSERT IGNORE INTO spu_prices 
            (spu, dxm_client_id, country_code, product_cost, shipping_cost, packing_cost, vat_cost, quantity, total_price) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
          `, [spu, dxmClientId, country, productCost, shippingCost, packingCost, vatCost, totalPrice]);
          
          console.log(`✅ 价格: ${spu} ${country} = $${totalPrice.toFixed(2)}`);
        } catch (error) {
          console.error(`❌ 创建价格 ${spu} ${country} 失败:`, error.message);
        }
      }
    }
  }

  /**
   * 根据国家和产品类型计算运费
   */
  getShippingCost(country, productType) {
    const baseShipping = {
      'charm': { base: 2.00, premium: 0.20 },
      'bag': { base: 3.50, premium: 0.30 },
      'other': { base: 3.00, premium: 0.25 }
    };
    
    const premiumCountries = ['FR', 'IT', 'ES', 'PT', 'GR'];
    const discountCountries = ['DE'];
    
    const base = baseShipping[productType]?.base || baseShipping.other.base;
    const premium = baseShipping[productType]?.premium || baseShipping.other.premium;
    
    if (premiumCountries.includes(country)) {
      return base + premium;
    } else if (discountCountries.includes(country)) {
      return base - premium;
    } else {
      return base;
    }
  }

  /**
   * 根据国家和产品类型计算税费
   */
  getVatCost(country, productType) {
    const vatRates = {
      'SE': 0.25, 'NO': 0.25, 'DK': 0.25, 'FI': 0.24,
      'FR': 0.20, 'IT': 0.22, 'ES': 0.21, 'PT': 0.23,
      'DE': 0.19, 'GB': 0.20, 'IE': 0.23,
      'GR': 0.24, 'HU': 0.27, 'CZ': 0.21,
      'SI': 0.22, 'BE': 0.21, 'RO': 0.19,
      'LT': 0.21, 'LV': 0.21, 'EE': 0.20
    };
    
    const basePrice = productType === 'charm' ? 5.00 : 
                     productType === 'bag' ? 15.00 : 10.00;
    
    const vatRate = vatRates[country] || 0.20;
    return basePrice * vatRate;
  }

  /**
   * 创建用户折扣规则
   */
  async createUserDiscountRules(connection, dxmClientId, totalOrders) {
    console.log(`💸 为客户 ${dxmClientId} 创建折扣规则...`);
    
    // 根据订单量设置不同的折扣规则
    let discountRules;
    
    if (totalOrders >= 1000) {
      // 大客户：更优惠的折扣
      discountRules = [
        { min: 1, max: 5, rate: 0.92 },    // 1-5件：92折
        { min: 6, max: 15, rate: 0.88 },   // 6-15件：88折
        { min: 16, max: 30, rate: 0.82 },  // 16-30件：82折
        { min: 31, max: 999, rate: 0.75 }  // 31件以上：75折
      ];
    } else if (totalOrders >= 100) {
      // 中等客户：标准折扣
      discountRules = [
        { min: 1, max: 4, rate: 0.95 },    // 1-4件：95折
        { min: 5, max: 10, rate: 0.90 },   // 5-10件：90折
        { min: 11, max: 20, rate: 0.85 },  // 11-20件：85折
        { min: 21, max: 999, rate: 0.80 }  // 21件以上：80折
      ];
    } else {
      // 小客户：基础折扣
      discountRules = [
        { min: 1, max: 3, rate: 0.98 },    // 1-3件：98折
        { min: 4, max: 8, rate: 0.95 },    // 4-8件：95折
        { min: 9, max: 15, rate: 0.90 },   // 9-15件：90折
        { min: 16, max: 999, rate: 0.85 }  // 16件以上：85折
      ];
    }
    
    // 删除现有的折扣规则
    await connection.execute(`
      DELETE FROM user_discount_rules WHERE dxm_client_id = ?
    `, [dxmClientId]);
    
    // 创建新的折扣规则
    for (const rule of discountRules) {
      await connection.execute(`
        INSERT INTO user_discount_rules (dxm_client_id, min_quantity, max_quantity, discount_rate) 
        VALUES (?, ?, ?, ?)
      `, [dxmClientId, rule.min, rule.max, rule.rate]);
      
      console.log(`✅ 折扣规则: ${rule.min}-${rule.max}件 = ${(rule.rate * 10).toFixed(1)}折`);
    }
  }

  /**
   * 主执行函数
   */
  async execute(dxmClientId) {
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      console.log(`🚀 开始为客户 ${dxmClientId} 补全结算数据...`);
      
      // 1. 分析订单数据
      const analysis = await this.analyzeClientOrders(connection, dxmClientId);
      
      if (analysis.totalOrders === 0) {
        console.log(`❌ 客户 ${dxmClientId} 没有任何订单`);
        return;
      }
      
      console.log(`📊 分析结果:`);
      console.log(`   - 总订单数: ${analysis.totalOrders}`);
      console.log(`   - 不同SKU数: ${analysis.skuInfo.size}`);
      console.log(`   - 涉及国家: ${Array.from(analysis.countryStats.keys()).join(', ')}`);
      console.log(`   - 订单数量范围: ${Array.from(analysis.quantityStats.keys()).sort((a,b) => a-b).join(', ')}`);
      
      // 2. 创建SPU
      const spuMap = await this.createSpus(connection, analysis.skuInfo);
      
      // 3. 创建SKU-SPU映射关系
      await this.createSkuSpuMappings(connection, spuMap);
      
      // 4. 为所有SPU、国家和数量组合创建价格（确保完整覆盖）
      await this.createCompletePricesWithQuantities(connection, dxmClientId, spuMap, analysis.countryStats, analysis.quantityStats);
      
      // 5. 创建用户折扣规则
      await this.createUserDiscountRules(connection, dxmClientId, analysis.totalOrders);
      
      // 6. 验证数据完整性
      await this.verifyDataCompleteness(connection, dxmClientId);
      
      await connection.commit();
      
      console.log(`🎉 客户 ${dxmClientId} 的结算数据补全完成！`);
      console.log(`📋 数据摘要:`);
      console.log(`   - 创建SPU: ${new Set(spuMap.values()).size} 个`);
      console.log(`   - SKU映射: ${spuMap.size} 个`);
      console.log(`   - 价格记录: ${new Set(spuMap.values()).size * analysis.countryStats.size} 个`);
      console.log(`   - 折扣规则: 4 个阶梯`);
      console.log(`\n🚀 现在可以进行结算计算了！`);
      
    } catch (error) {
      await connection.rollback();
      console.error('❌ 补全数据时发生错误:', error);
      throw error;
    } finally {
      if (connection.release) {
        connection.release();
      } else {
        await connection.end();
      }
    }
  }

  /**
   * 创建SPU（复用之前的逻辑）
   */
  async createSpus(connection, skuInfo) {
    console.log(`📦 创建SPU...`);
    
    const spuMap = new Map();
    const spusToCreate = new Map();
    
    for (const [sku, info] of skuInfo) {
      const spu = this.generateSpuFromSku(sku, info.name);
      spuMap.set(sku, spu);
      
      if (!spusToCreate.has(spu)) {
        let weight = 0.300;
        if (info.name.toLowerCase().includes('charm')) {
          weight = 0.050;
        } else if (info.name.toLowerCase().includes('bag')) {
          weight = 0.450;
        }
        
        let spuName = info.name
          .replace(/ - \w+$/g, '')
          .replace(/ \w+$/g, '')
          .trim();
        
        if (spuName.length < 10) {
          spuName = info.name;
        }
        
        spusToCreate.set(spu, { name: spuName, weight });
      }
    }
    
    for (const [spu, data] of spusToCreate) {
      try {
        await connection.execute(`
          INSERT IGNORE INTO spus (spu, name, weight) 
          VALUES (?, ?, ?)
        `, [spu, data.name, data.weight]);
        
        console.log(`✅ 创建SPU: ${spu} - ${data.name}`);
      } catch (error) {
        console.error(`❌ 创建SPU ${spu} 失败:`, error.message);
      }
    }
    
    return spuMap;
  }

  /**
   * 创建SKU-SPU映射关系（复用之前的逻辑）
   */
  async createSkuSpuMappings(connection, spuMap) {
    console.log(`🔗 创建SKU-SPU映射关系...`);
    
    for (const [sku, spu] of spuMap) {
      try {
        await connection.execute(`
          INSERT IGNORE INTO sku_spu_relations (sku, spu) 
          VALUES (?, ?)
        `, [sku, spu]);
        
        console.log(`✅ 映射关系: ${sku} -> ${spu}`);
      } catch (error) {
        console.error(`❌ 创建映射 ${sku} -> ${spu} 失败:`, error.message);
      }
    }
  }

  /**
   * 创建完整的SPU价格覆盖（包含所有数量组合）
   */
  async createCompletePricesWithQuantities(connection, dxmClientId, spuMap, countryStats, quantityStats) {
    console.log(`💰 为客户 ${dxmClientId} 创建完整的SPU价格覆盖（包含所有数量）...`);
    
    const uniqueSpus = new Set(spuMap.values());
    const countries = Array.from(countryStats.keys());
    const quantities = Array.from(quantityStats.keys()).sort((a, b) => a - b);
    let createdCount = 0;
    let skippedCount = 0;
    
    console.log(`📋 需要创建价格: ${uniqueSpus.size} 个SPU × ${countries.length} 个国家 × ${quantities.length} 个数量 = ${uniqueSpus.size * countries.length * quantities.length} 条记录`);
    console.log(`📋 数量范围: ${quantities.join(', ')} 件`);
    
    for (const spu of uniqueSpus) {
      for (const country of countries) {
        for (const quantity of quantities) {
          try {
            // 检查是否已存在
            const [existing] = await connection.execute(`
              SELECT id FROM spu_prices 
              WHERE spu = ? AND dxm_client_id = ? AND country_code = ? AND quantity = ?
            `, [spu, dxmClientId, country, quantity]);
            
            if (existing.length > 0) {
              skippedCount++;
              continue;
            }
            
            let baseCost, baseShipping, basePacking, baseVat;
            
            // 根据SPU类型设置基础价格
            if (spu.startsWith('CHARM-')) {
              baseCost = 5.00;
              baseShipping = this.getShippingCost(country, 'charm');
              basePacking = 0.50;
              baseVat = this.getVatCost(country, 'charm');
            } else if (spu.startsWith('BAG-') || spu.startsWith('TOTE-')) {
              baseCost = 15.00;
              baseShipping = this.getShippingCost(country, 'bag');
              basePacking = 1.00;
              baseVat = this.getVatCost(country, 'bag');
            } else {
              baseCost = 10.00;
              baseShipping = this.getShippingCost(country, 'other');
              basePacking = 0.80;
              baseVat = this.getVatCost(country, 'other');
            }
            
            // 根据数量计算价格（数量越多，单价越优惠）
            const quantityDiscount = quantity > 1 ? Math.max(0.85, 1 - (quantity - 1) * 0.05) : 1;
            const productCost = baseCost * quantity * quantityDiscount;
            
            // 运费和包装费有一定的数量优惠
            const shippingCost = baseShipping + (quantity - 1) * baseShipping * 0.3;
            const packingCost = basePacking * quantity * 0.8; // 包装费有规模优惠
            const vatCost = baseVat * quantity * quantityDiscount;
            
            const totalPrice = productCost + shippingCost + packingCost + vatCost;
            
            await connection.execute(`
              INSERT INTO spu_prices 
              (spu, dxm_client_id, country_code, product_cost, shipping_cost, packing_cost, vat_cost, quantity, total_price) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [spu, dxmClientId, country, productCost, shippingCost, packingCost, vatCost, quantity, totalPrice]);
            
            createdCount++;
            if (createdCount <= 20) { // 只显示前20条，避免日志过长
              console.log(`✅ 价格: ${spu} ${country} ×${quantity} = $${totalPrice.toFixed(2)}`);
            }
          } catch (error) {
            console.error(`❌ 创建价格 ${spu} ${country} ×${quantity} 失败:`, error.message);
          }
        }
      }
    }
    
    console.log(`💰 价格创建完成: 新增 ${createdCount} 条, 跳过 ${skippedCount} 条已存在记录`);
  }

  /**
   * 验证数据完整性
   */
  async verifyDataCompleteness(connection, dxmClientId) {
    console.log(`🔍 验证客户 ${dxmClientId} 的数据完整性...`);
    
    const tables = this.getAllOrderTableNames();
    let missingDataCount = 0;
    
    for (const tableName of tables) {
      try {
        const [missing] = await connection.execute(`
          SELECT COUNT(*) as missing_count
          FROM ${tableName} o
          LEFT JOIN sku_spu_relations r ON o.product_sku = r.sku
          LEFT JOIN spu_prices p ON r.spu = p.spu AND o.dxm_client_id = p.dxm_client_id AND o.country_code = p.country_code
          WHERE o.dxm_client_id = ? 
          AND (r.spu IS NULL OR p.total_price IS NULL)
        `, [dxmClientId]);
        
        missingDataCount += missing[0].missing_count;
      } catch (error) {
        console.warn(`⚠️ 验证表 ${tableName} 时出错:`, error.message);
      }
    }
    
    if (missingDataCount === 0) {
      console.log(`✅ 数据完整性验证通过: 客户 ${dxmClientId} 的所有订单都有完整的价格信息`);
    } else {
      console.log(`❌ 数据完整性验证失败: 还有 ${missingDataCount} 个订单缺少价格信息`);
      
      // 显示缺失的具体信息
      for (const tableName of tables) {
        try {
          const [missingDetails] = await connection.execute(`
            SELECT DISTINCT o.product_sku, r.spu, o.country_code, o.product_name
            FROM ${tableName} o
            LEFT JOIN sku_spu_relations r ON o.product_sku = r.sku
            LEFT JOIN spu_prices p ON r.spu = p.spu AND o.dxm_client_id = p.dxm_client_id AND o.country_code = p.country_code
            WHERE o.dxm_client_id = ? 
            AND (r.spu IS NULL OR p.total_price IS NULL)
            LIMIT 10
          `, [dxmClientId]);
          
          if (missingDetails.length > 0) {
            console.log(`❌ 表 ${tableName} 缺失数据:`);
            missingDetails.forEach(item => {
              console.log(`   - SKU: ${item.product_sku}, SPU: ${item.spu || 'NULL'}, 国家: ${item.country_code}, 产品: ${item.product_name}`);
            });
          }
        } catch (error) {
          // 忽略错误
        }
      }
    }
    
    return missingDataCount === 0;
  }
}

// 主执行逻辑
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🔧 自动补全结算数据脚本

使用方法：
  node auto-complete-settlement-data.js <dxm_client_id>

例如：
  node auto-complete-settlement-data.js 7180831

功能：
  ✅ 自动分析客户订单数据
  ✅ 创建缺失的SPU
  ✅ 建立SKU-SPU映射关系  
  ✅ 生成SPU价格表
  ✅ 配置用户折扣规则
    `);
    process.exit(1);
  }
  
  const dxmClientId = parseInt(args[0]);
  
  if (isNaN(dxmClientId) || dxmClientId <= 0) {
    console.error('❌ 请提供有效的客户ID（正整数）');
    process.exit(1);
  }
  
  const completer = new SettlementDataCompleter();
  
  try {
    await completer.execute(dxmClientId);
    console.log(`\n✅ 完成！客户 ${dxmClientId} 现在可以进行结算计算了。`);
  } catch (error) {
    console.error('❌ 脚本执行失败:', error.message);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SettlementDataCompleter;
