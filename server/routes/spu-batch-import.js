const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { authenticateAdmin } = require('../middleware/adminAuth');
const { getConnection } = require('../config/database');

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // 只允许Excel文件
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传Excel文件(.xlsx, .xls)'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * 解析Excel文件数据
 */
function parseExcelData(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    console.log('📋 工作表列表:', workbook.SheetNames);
    
    // 检查必需的工作表
    if (!workbook.SheetNames.includes('SPU')) {
      throw new Error('Excel文件缺少"SPU"工作表');
    }
    if (!workbook.SheetNames.includes('SKU-SPU')) {
      throw new Error('Excel文件缺少"SKU-SPU"工作表');
    }
    
    // 解析SPU工作表
    const spuSheet = workbook.Sheets['SPU'];
    const spuData = XLSX.utils.sheet_to_json(spuSheet, { header: 1 });
    
    // 解析SKU-SPU工作表
    const skuSpuSheet = workbook.Sheets['SKU-SPU'];
    const skuSpuData = XLSX.utils.sheet_to_json(skuSpuSheet, { header: 1 });
    
    console.log('📊 SPU数据行数:', spuData.length);
    console.log('📊 SKU-SPU数据行数:', skuSpuData.length);
    
    return {
      spuData: spuData.slice(1), // 去掉表头
      skuSpuData: skuSpuData.slice(1) // 去掉表头
    };
    
  } catch (error) {
    console.error('❌ 解析Excel文件失败:', error);
    throw new Error('Excel文件格式错误: ' + error.message);
  }
}

/**
 * 处理SPU数据
 */
function processSPUData(spuData) {
  const processedSpus = [];
  
  spuData.forEach((row, index) => {
    // 跳过空行
    if (!row || row.length === 0 || !row[0]) {
      return;
    }
    
    try {
      const [spu, name, photo, logistics_methods, weight] = row;
      
      // 验证必需字段
      if (!spu || !name) {
        console.warn(`⚠️ 第${index + 2}行数据不完整，跳过:`, row);
        return;
      }
      
      // 处理图片URL (去掉DISPIMG函数)
      let photoUrl = photo;
      if (typeof photo === 'string' && photo.includes('DISPIMG')) {
        // 提取DISPIMG中的ID，但暂时设为空，因为需要额外处理
        photoUrl = null;
        console.log(`📷 第${index + 2}行包含DISPIMG函数，图片URL暂时设为空`);
      }
      
      processedSpus.push({
        spu: String(spu).trim(),
        name: String(name).trim(),
        photo: photoUrl,
        logistics_methods: logistics_methods ? String(logistics_methods).trim() : null,
        weight: weight ? parseFloat(weight) : null,
        parent_spu: String(spu).trim(), // 默认父SPU为自己
        rowIndex: index + 2 // Excel行号（从2开始）
      });
      
    } catch (error) {
      console.error(`❌ 处理第${index + 2}行数据失败:`, error, row);
    }
  });
  
  console.log(`✅ 处理完成，有效SPU数据: ${processedSpus.length} 条`);
  return processedSpus;
}

/**
 * 处理SKU-SPU关系数据
 */
function processSKUData(skuSpuData) {
  const skuMap = new Map(); // SPU -> SKU列表的映射
  
  skuSpuData.forEach((row, index) => {
    // 跳过空行
    if (!row || row.length === 0 || !row[0] || !row[1]) {
      return;
    }
    
    try {
      const [sku, spu] = row;
      const skuStr = String(sku).trim();
      const spuStr = String(spu).trim();
      
      if (!skuMap.has(spuStr)) {
        skuMap.set(spuStr, []);
      }
      
      skuMap.get(spuStr).push(skuStr);
      
    } catch (error) {
      console.error(`❌ 处理SKU数据第${index + 2}行失败:`, error, row);
    }
  });
  
  console.log(`✅ SKU关系处理完成，涉及SPU: ${skuMap.size} 个`);
  
  // 显示每个SPU的SKU数量
  skuMap.forEach((skus, spu) => {
    console.log(`  SPU ${spu}: ${skus.length} 个SKU`);
  });
  
  return skuMap;
}

/**
 * 批量导入SPU API
 */
router.post('/import', authenticateAdmin, upload.single('file'), async (req, res) => {
  try {
    console.log('🚀 开始SPU批量导入...');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传Excel文件'
      });
    }
    
    console.log('📁 上传文件信息:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    // 解析Excel数据
    const { spuData, skuSpuData } = parseExcelData(req.file.buffer);
    
    // 处理数据
    const processedSpus = processSPUData(spuData);
    const skuMap = processSKUData(skuSpuData);
    
    if (processedSpus.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有找到有效的SPU数据'
      });
    }
    
    // 数据库操作
    const pool = await getConnection();
    const connection = await pool.getConnection();
    
    let importResults = {
      totalSpu: processedSpus.length,
      successSpu: 0,
      failedSpu: 0,
      totalSku: 0,
      successSku: 0,
      failedSku: 0,
      errors: []
    };
    
    try {
      await connection.beginTransaction();
      
      // 导入SPU数据
      for (const spuItem of processedSpus) {
        try {
          // 检查SPU是否已存在
          const [existingRows] = await connection.execute(
            'SELECT spu FROM spus WHERE spu = ?',
            [spuItem.spu]
          );
          
          if (existingRows.length > 0) {
            importResults.errors.push(`第${spuItem.rowIndex}行: SPU ${spuItem.spu} 已存在，跳过`);
            importResults.failedSpu++;
            continue;
          }
          
          // 插入SPU
          await connection.execute(`
            INSERT INTO spus (spu, name, photo, logistics_methods, weight, parent_spu)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            spuItem.spu,
            spuItem.name,
            spuItem.photo,
            spuItem.logistics_methods,
            spuItem.weight,
            spuItem.parent_spu
          ]);
          
          importResults.successSpu++;
          
          // 导入该SPU的SKU
          const skus = skuMap.get(spuItem.spu) || [];
          importResults.totalSku += skus.length;
          
          for (const sku of skus) {
            try {
              await connection.execute(`
                INSERT INTO sku_spu_relations (sku, spu)
                VALUES (?, ?)
              `, [sku, spuItem.spu]);
              
              importResults.successSku++;
            } catch (skuError) {
              console.error(`❌ 导入SKU失败: ${sku}`, skuError);
              importResults.errors.push(`SKU ${sku} 导入失败: ${skuError.message}`);
              importResults.failedSku++;
            }
          }
          
          console.log(`✅ SPU ${spuItem.spu} 导入成功，包含 ${skus.length} 个SKU`);
          
        } catch (spuError) {
          console.error(`❌ 导入SPU失败: ${spuItem.spu}`, spuError);
          importResults.errors.push(`第${spuItem.rowIndex}行: SPU ${spuItem.spu} 导入失败: ${spuError.message}`);
          importResults.failedSpu++;
        }
      }
      
      await connection.commit();
      
      res.json({
        success: true,
        message: '批量导入完成',
        data: importResults
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ SPU批量导入失败:', error);
    res.status(500).json({
      success: false,
      message: '批量导入失败: ' + error.message
    });
  }
});

/**
 * 下载导入模板
 */
router.get('/template', authenticateAdmin, (req, res) => {
  try {
    const templatePath = require('path').join(__dirname, '../resource/批量导入SPU模板.xlsx');
    res.download(templatePath, '批量导入SPU模板.xlsx');
  } catch (error) {
    console.error('❌ 下载模板失败:', error);
    res.status(500).json({
      success: false,
      message: '下载模板失败'
    });
  }
});

module.exports = router;
