#!/usr/bin/env node

/**
 * 数据库设置脚本
 * 用于初始化promotion系统的数据库
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config/.env') });

class DatabaseSetup {
  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    };
  }

  async createConnection() {
    try {
      this.connection = await mysql.createConnection(this.config);
      console.log('✅ Database connection established');
      return this.connection;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async executeSchema() {
    try {
      console.log('📊 Reading schema file...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = await fs.readFile(schemaPath, 'utf8');

      console.log('🔨 Executing schema...');
      await this.connection.execute(schema);
      console.log('✅ Schema executed successfully');
    } catch (error) {
      console.error('❌ Schema execution failed:', error.message);
      throw error;
    }
  }

  async verifyTables() {
    try {
      console.log('🔍 Verifying tables...');
      
      const [rows] = await this.connection.execute(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'syntaxdropshipping'
        ORDER BY TABLE_NAME
      `);

      const expectedTables = [
        'contact_persons',
        'discovered_websites', 
        'email_templates',
        'extracted_emails',
        'promotion_campaigns',
        'promotion_records',
        'system_settings',
        'task_queue'
      ];

      const actualTables = rows.map(row => row.TABLE_NAME);
      
      console.log('📋 Created tables:');
      actualTables.forEach(table => {
        console.log(`  ✅ ${table}`);
      });

      const missingTables = expectedTables.filter(table => !actualTables.includes(table));
      if (missingTables.length > 0) {
        console.log('⚠️  Missing tables:');
        missingTables.forEach(table => {
          console.log(`  ❌ ${table}`);
        });
      }

      return actualTables.length === expectedTables.length;
    } catch (error) {
      console.error('❌ Table verification failed:', error.message);
      return false;
    }
  }

  async checkDefaultData() {
    try {
      console.log('📋 Checking default data...');
      
      // 检查系统设置
      const [settings] = await this.connection.execute(
        'SELECT COUNT(*) as count FROM system_settings'
      );
      console.log(`  📊 System settings: ${settings[0].count} records`);

      // 检查邮件模板
      const [templates] = await this.connection.execute(
        'SELECT COUNT(*) as count FROM email_templates'
      );
      console.log(`  📧 Email templates: ${templates[0].count} records`);

      return true;
    } catch (error) {
      console.error('❌ Default data check failed:', error.message);
      return false;
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('🔌 Database connection closed');
    }
  }

  async setup() {
    try {
      console.log('🚀 Starting database setup...\n');
      
      await this.createConnection();
      await this.executeSchema();
      
      const tablesOk = await this.verifyTables();
      const dataOk = await this.checkDefaultData();
      
      if (tablesOk && dataOk) {
        console.log('\n🎉 Database setup completed successfully!');
        console.log('📝 Next steps:');
        console.log('  1. Copy config/env.example to config/.env');
        console.log('  2. Update your database credentials in .env');
        console.log('  3. Run: npm run discover');
      } else {
        console.log('\n⚠️  Database setup completed with warnings');
      }
      
    } catch (error) {
      console.error('\n❌ Database setup failed:', error.message);
      process.exit(1);
    } finally {
      await this.close();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const setup = new DatabaseSetup();
  setup.setup();
}

module.exports = DatabaseSetup;
