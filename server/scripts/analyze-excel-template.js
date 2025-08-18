const XLSX = require('xlsx');
const path = require('path');

async function analyzeExcelTemplate() {
  try {
    console.log('📊 分析Excel模板文件结构...');
    
    const templatePath = path.join(__dirname, '../resource/批量导入SPU模板.xlsx');
    console.log('📁 模板文件路径:', templatePath);
    
    // 读取Excel文件
    const workbook = XLSX.readFile(templatePath);
    console.log('📋 工作表列表:', workbook.SheetNames);
    
    // 分析每个工作表
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log(`\n📄 工作表 ${index + 1}: ${sheetName}`);
      console.log('=' .repeat(50));
      
      const worksheet = workbook.Sheets[sheetName];
      
      // 获取工作表范围
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      console.log('📐 数据范围:', worksheet['!ref']);
      console.log('📊 行数:', range.e.r + 1, '列数:', range.e.c + 1);
      
      // 转换为JSON格式查看数据
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log('\n📋 表头 (第一行):');
      if (jsonData.length > 0) {
        console.log(jsonData[0]);
      }
      
      console.log('\n📋 数据示例 (前3行):');
      jsonData.slice(0, Math.min(4, jsonData.length)).forEach((row, rowIndex) => {
        console.log(`第${rowIndex + 1}行:`, row);
      });
      
      // 分析列结构
      if (jsonData.length > 0) {
        const headers = jsonData[0];
        console.log('\n📊 列结构分析:');
        headers.forEach((header, colIndex) => {
          const columnLetter = XLSX.utils.encode_col(colIndex);
          console.log(`  ${columnLetter}列: ${header}`);
        });
      }
    });
    
    console.log('\n🎉 Excel模板分析完成!');
    
  } catch (error) {
    console.error('❌ 分析Excel模板失败:', error);
  }
}

// 运行分析
if (require.main === module) {
  analyzeExcelTemplate();
}

module.exports = analyzeExcelTemplate;
