const XLSX = require('xlsx');

/**
 * 订单Excel解析器
 * 负责解析订单Excel文件并转换为数据库格式
 */
class OrderExcelParser {
  constructor() {
    // Excel列名与数据库字段的映射关系
    this.columnMapping = {
      '订单号': 'dxm_order_id',
      '国家二字码': 'country_code', 
      '产品总数': 'product_count',
      '买家姓名': 'buyer_name',
      '产品名称': 'product_name',
      '付款时间': 'payment_time',
      '运单号': 'waybill_number',
      '商品SKU': 'product_sku',
      'SPU': 'product_spu',
      '替换SPU': 'product_parent_spu',
      '折扣': 'discount',
      '订单状态': 'order_status',
      '客服备注': 'customer_remark',
      '拣货备注': 'picking_remark', 
      '订单备注': 'order_remark'
    };
  }

  /**
   * 解析Excel文件
   * @param {Buffer} buffer - Excel文件buffer
   * @returns {object} 解析结果
   */
  parseExcel(buffer) {
    try {
      console.log('📊 开始解析订单Excel文件...');
      
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      console.log('📋 工作表列表:', workbook.SheetNames);
      
      if (workbook.SheetNames.length === 0) {
        throw new Error('Excel文件中没有工作表');
      }

      // 使用第一个工作表
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // 转换为JSON数据
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        throw new Error('Excel文件数据不足，至少需要表头和一行数据');
      }

      console.log(`📊 Excel数据行数: ${jsonData.length} (包含表头)`);
      
      // 解析表头
      const headers = jsonData[0];
      const headerMapping = this.buildHeaderMapping(headers);
      
      // 解析数据行
      const orders = [];
      const errors = [];
      
      for (let i = 1; i < jsonData.length; i++) {
        try {
          const row = jsonData[i];
          const orderData = this.parseOrderRow(row, headerMapping);
          
          if (orderData) {
            orders.push(orderData);
          }
        } catch (error) {
          console.error(`❌ 解析第${i + 1}行数据失败:`, error.message);
          errors.push({
            row: i + 1,
            data: jsonData[i],
            error: error.message
          });
        }
      }

      console.log(`✅ 成功解析 ${orders.length} 条订单数据，${errors.length} 条失败`);
      
      return {
        success: true,
        total: jsonData.length - 1,
        parsed: orders.length,
        failed: errors.length,
        orders: orders,
        errors: errors,
        headers: headers
      };
      
    } catch (error) {
      console.error('❌ 解析Excel文件失败:', error);
      return {
        success: false,
        error: error.message,
        orders: [],
        errors: []
      };
    }
  }

  /**
   * 构建表头映射关系
   * @param {Array} headers - Excel表头
   * @returns {object} 映射关系
   */
  buildHeaderMapping(headers) {
    const mapping = {};
    
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        const trimmedHeader = header.trim();
        if (this.columnMapping[trimmedHeader]) {
          mapping[index] = this.columnMapping[trimmedHeader];
        }
      }
    });

    console.log('📋 表头映射关系:', mapping);
    
    // 检查必需字段
    const requiredFields = ['dxm_order_id'];
    const mappedFields = Object.values(mapping);
    
    for (const field of requiredFields) {
      if (!mappedFields.includes(field)) {
        throw new Error(`缺少必需字段: ${field}`);
      }
    }
    
    return mapping;
  }

  /**
   * 解析单行订单数据
   * @param {Array} row - Excel行数据
   * @param {object} headerMapping - 表头映射
   * @returns {object} 订单数据
   */
  parseOrderRow(row, headerMapping) {
    const orderData = {};
    const remarks = {};

    // 解析基本字段
    for (const [colIndex, fieldName] of Object.entries(headerMapping)) {
      const cellValue = row[parseInt(colIndex)];
      
      if (fieldName === 'customer_remark' || fieldName === 'picking_remark' || fieldName === 'order_remark') {
        // 备注字段单独处理
        remarks[fieldName] = this.cleanStringValue(cellValue);
      } else {
        orderData[fieldName] = this.parseFieldValue(fieldName, cellValue);
      }
    }

    // 验证必需字段
    if (!orderData.dxm_order_id) {
      throw new Error('订单号不能为空');
    }

    // 验证订单号格式
    if (typeof orderData.dxm_order_id !== 'string' || !orderData.dxm_order_id.includes('-')) {
      throw new Error(`订单号格式错误: ${orderData.dxm_order_id}`);
    }

    // 处理备注字段
    const hasRemarks = Object.values(remarks).some(remark => remark && remark.trim());
    if (hasRemarks) {
      orderData.remark = remarks;
    }

    // 设置默认值
    this.setDefaultValues(orderData);

    // 检查结算条件并设置状态
    this.checkAndSetSettlementStatus(orderData);

    return orderData;
  }

  /**
   * 解析字段值
   * @param {string} fieldName - 字段名
   * @param {any} cellValue - 单元格值
   * @returns {any} 解析后的值
   */
  parseFieldValue(fieldName, cellValue) {
    if (cellValue === null || cellValue === undefined || cellValue === '') {
      return null;
    }

    switch (fieldName) {
      case 'dxm_order_id':
      case 'country_code':
      case 'buyer_name':
      case 'product_name':
      case 'waybill_number':
      case 'product_sku':
      case 'product_spu':
      case 'product_parent_spu':
      case 'order_status':
        return this.cleanStringValue(cellValue);

      case 'product_count':
        return this.parseIntValue(cellValue);

      case 'payment_time':
        return this.parseDateValue(cellValue);

      case 'unit_price':
      case 'multi_total_price':
      case 'discount':
      case 'settlement_amount':
        return this.parseDecimalValue(cellValue);

      default:
        return cellValue;
    }
  }

  /**
   * 清理字符串值
   * @param {any} value - 原始值
   * @returns {string|null} 清理后的字符串
   */
  cleanStringValue(value) {
    if (value === null || value === undefined) {
      return null;
    }
    
    const str = String(value).trim();
    return str === '' ? null : str;
  }

  /**
   * 解析整数值
   * @param {any} value - 原始值
   * @returns {number|null} 整数值
   */
  parseIntValue(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    const num = parseInt(value);
    return isNaN(num) ? null : num;
  }

  /**
   * 解析小数值
   * @param {any} value - 原始值
   * @returns {number|null} 小数值
   */
  parseDecimalValue(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  /**
   * 解析日期值
   * @param {any} value - 原始值
   * @returns {string|null} 格式化的日期字符串
   */
  parseDateValue(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    try {
      let date;
      
      if (typeof value === 'number') {
        // Excel日期数字格式
        date = XLSX.SSF.parse_date_code(value);
        if (date) {
          return new Date(date.y, date.m - 1, date.d, date.H || 0, date.M || 0, date.S || 0)
            .toISOString().slice(0, 19).replace('T', ' ');
        }
      } else if (typeof value === 'string') {
        // 字符串日期格式
        const parsedDate = new Date(value);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().slice(0, 19).replace('T', ' ');
        }
      }
      
      return null;
    } catch (error) {
      console.warn(`⚠️ 日期解析失败: ${value}`, error.message);
      return null;
    }
  }

  /**
   * 设置默认值
   * @param {object} orderData - 订单数据
   */
  setDefaultValues(orderData) {
    // 设置数值类型默认值
    if (orderData.product_count === null) {
      orderData.product_count = 1;
    }
    
    if (orderData.unit_price === null) {
      orderData.unit_price = 0;
    }
    
    if (orderData.multi_total_price === null) {
      orderData.multi_total_price = 0;
    }
    
    if (orderData.discount === null) {
      orderData.discount = 0;
    }
    
    if (orderData.settlement_amount === null) {
      orderData.settlement_amount = 0;
    }

    // 设置默认结算状态（将在checkAndSetSettlementStatus中重新设置）
    orderData.settlement_status = 'waiting';
  }

  /**
   * 检查结算条件并设置状态
   * @param {object} orderData - 订单数据
   */
  checkAndSetSettlementStatus(orderData) {
    let settlement_status = 'waiting';
    let settle_remark = null;
    
    // 条件1：订单状态为已退款
    if (orderData.order_status === '已退款') {
      settlement_status = 'cancel';
      settle_remark = '订单状态为已退款，无需结算';
    }
    // 条件2：备注中包含"不结算"
    else if (this.checkRemarkContainsNoSettlement(orderData.remark)) {
      settlement_status = 'cancel';
      settle_remark = '备注中标记不结算，无需结算';
    }
    // 条件3：SKU为Upsell
    else if (orderData.product_sku === 'Upsell') {
      settlement_status = 'cancel';
      settle_remark = 'SKU为Upsell产品，无需结算';
    }
    
    orderData.settlement_status = settlement_status;
    orderData.settle_remark = settle_remark;
  }

  /**
   * 检查备注是否包含"不结算"
   * @param {any} remark - 备注数据
   * @returns {boolean} 是否包含不结算标记
   */
  checkRemarkContainsNoSettlement(remark) {
    if (!remark) return false;
    
    // 如果remark是对象，检查三个备注字段
    if (typeof remark === 'object') {
      const allRemarks = [
        remark.customer_remark,   // 客服备注
        remark.picking_remark,    // 拣货备注
        remark.order_remark       // 订单备注
      ].filter(Boolean).join(' ');
      
      return allRemarks.includes('不结算');
    }
    
    // 如果是字符串，直接检查
    return String(remark).includes('不结算');
  }

  /**
   * 验证订单数据
   * @param {Array} orders - 订单数据数组
   * @returns {object} 验证结果
   */
  validateOrders(orders) {
    const validOrders = [];
    const invalidOrders = [];

    // 必需字段列表
    const requiredFields = [
      'dxm_order_id',
      'country_code', 
      'product_count',
      'buyer_name',
      'payment_time',
      'order_status',
      'product_sku'  // 添加SKU为必需字段
    ];

    // SKU必需字段（用于区分正常订单和异常订单）
    const skuRequiredFields = ['product_sku'];

    orders.forEach((order, index) => {
      const errors = [];

      // 检查是否为已退款订单
      const isRefundedOrder = order.order_status === '已退款';
      
      // 检查SKU是否为空（作为异常订单的判断条件）
      const hasEmptySku = !order.product_sku || order.product_sku === null || order.product_sku.toString().trim() === '';
      
      // 如果SKU为空，直接标记为验证失败（不保存到任何表）
      if (hasEmptySku) {
        errors.push('商品SKU为空，订单将不会保存到任何表中，请先在店小秘中绑定商品后再重新导入，记住一定要重新导入，否则会丢失要结算的订单，后果自付');
      } else {
        // SKU不为空的订单进行正常验证
        // 验证必需字段（已退款订单放宽验证）
        if (!isRefundedOrder) {
          // 非退款订单需要验证所有必需字段
          requiredFields.forEach(field => {
            if (!order[field] || order[field] === null || order[field] === '') {
              const fieldNames = {
                'dxm_order_id': '订单号',
                'country_code': '国家代码',
                'product_count': '产品数量',
                'buyer_name': '买家姓名',
                'payment_time': '付款时间',
                'order_status': '订单状态',
                'product_sku': '商品SKU'
              };
              errors.push(`${fieldNames[field] || field}不能为空`);
            }
          });
        } else {
          // 已退款订单只验证订单号和订单状态
          const refundRequiredFields = ['dxm_order_id', 'order_status'];
          refundRequiredFields.forEach(field => {
            if (!order[field] || order[field] === null || order[field] === '') {
              const fieldNames = {
                'dxm_order_id': '订单号',
                'order_status': '订单状态'
              };
              errors.push(`${fieldNames[field] || field}不能为空`);
            }
          });
        }
      }

      // 验证订单号格式
      if (order.dxm_order_id && typeof order.dxm_order_id === 'string') {
        if (!order.dxm_order_id.includes('-')) {
          errors.push('订单号格式错误，应包含"-"分隔符');
        } else {
          const parts = order.dxm_order_id.split('-');
          if (parts.length !== 2) {
            errors.push('订单号格式错误，应为"客户ID-订单ID"格式');
          } else {
            const [clientId, orderId] = parts;
            if (isNaN(parseInt(clientId)) || isNaN(parseInt(orderId))) {
              errors.push('订单号包含非数字字符');
            }
          }
        }
      }



      // 验证付款时间格式
      if (order.payment_time && typeof order.payment_time === 'string') {
        const paymentDate = new Date(order.payment_time);
        if (isNaN(paymentDate.getTime())) {
          errors.push('付款时间格式错误');
        }
      }

      if (errors.length === 0) {
        validOrders.push(order);
      } else {
        invalidOrders.push({
          index: index,
          order: order,
          errors: errors
        });
      }
    });

    console.log(`📊 订单验证结果: 有效${validOrders.length}条, 无效${invalidOrders.length}条`);
    
    if (invalidOrders.length > 0) {
      console.log('❌ 验证失败的订单样例 (前5条):');
      invalidOrders.slice(0, 5).forEach((invalid, index) => {
        console.log(`  ${index + 1}. 第${invalid.index + 1}行: ${invalid.errors.join(', ')}`);
        console.log(`     订单号: ${invalid.order.dxm_order_id || '无'}`);
      });
    }

    return {
      valid: validOrders,
      invalid: invalidOrders,
      validCount: validOrders.length,
      invalidCount: invalidOrders.length
    };
  }
}

module.exports = OrderExcelParser;


