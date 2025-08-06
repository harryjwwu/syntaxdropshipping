const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Database configuration for initial connection (without database selection)
const initialConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  timezone: '+08:00'
};

// Function to initialize database
async function initializeDatabase() {
  let connection = null;
  
  try {
    console.log('🔄 Connecting to MySQL server...');
    
    // Create connection to MySQL server
    connection = await mysql.createConnection(initialConfig);
    console.log('✅ Connected to MySQL server');

    // Create database
    const dbName = process.env.DB_NAME || 'syntaxdropshipping';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' created/verified`);

    // Use the database (use query instead of execute for USE statement)
    await connection.query(`USE \`${dbName}\``);
    console.log(`✅ Using database '${dbName}'`);

    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'database-schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Remove comments and split into statements
    const cleanSchema = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n');
    
    const statements = cleanSchema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt !== '');
    
    for (const statement of statements) {
      try {
        // Skip database creation and use statements as we already handled them
        if (statement.includes('CREATE DATABASE') || statement.includes('USE ')) {
          continue;
        }
        
        if (statement.trim()) {
          await connection.query(statement);
          const statementType = statement.split(' ').slice(0, 3).join(' ');
          console.log(`✅ Executed: ${statementType}...`);
        }
      } catch (error) {
        console.error('Error executing statement:', statement.substring(0, 100) + '...');
        console.error('Error details:', error.message);
        throw error;
      }
    }
    
    console.log('✅ Database schema created successfully');

    // Insert initial data
    await insertInitialData(connection);
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Function to insert initial data
async function insertInitialData(connection) {
  try {
    // Check if admin user already exists
    const [adminRows] = await connection.execute('SELECT * FROM users WHERE email = ?', ['admin@syntaxdropshipping.com']);
    
    if (adminRows.length === 0) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      // Insert admin user
      await connection.execute(
        'INSERT INTO users (email, password, name, company, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin@syntaxdropshipping.com', hashedPassword, 'Admin User', 'Syntax Dropshipping', 'admin', true]
      );
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Insert sample products
    const sampleProducts = [
      {
        title: 'Portable 3 In 1 Fan Air Conditioner',
        description: 'Household Small Air Cooler LED Night Lights Humidifier Air Adjustment Home Fans',
        price: '$3.20',
        category: 'Home Appliances',
        is_hot: true,
        sku: 'AC-FAN-001'
      },
      {
        title: '2in1 Microfiber Screen Cleaner',
        description: 'Spray Bottle Set Mobile Phone iPad Camera GoPro Computer Microfiber Cloth Cleaning',
        price: '$0.19-1.00',
        category: 'Electronics',
        is_hot: true,
        sku: 'CLEAN-001'
      },
      {
        title: 'Mini Magnetic Wireless Power Bank',
        description: 'Fast Charging Portable 5000mAh Wireless Power Bank',
        price: '$4.57-5.00',
        category: 'Electronics',
        is_hot: true,
        sku: 'PWR-001'
      },
      {
        title: 'Car Air Purifier',
        description: 'Portable Negative Ion Generator Remove Formaldehyde Dust Smoke Air Freshener',
        price: '$1.57-6.29',
        category: 'Auto Accessories',
        is_hot: true,
        sku: 'CAR-001'
      },
      {
        title: 'Star Projector with Bluetooth Speaker',
        description: 'Galaxy Lamp Multicolor Night Light for Bedroom',
        price: '$4.00',
        category: 'Home Decor',
        is_hot: true,
        sku: 'PROJ-001'
      },
      {
        title: 'Portable Mini Thermal Label Printer',
        description: 'Home Photo Printer Student Wrong Question Printer Bluetooth Mini Label Printer',
        price: '$2.43-34.05',
        category: 'Office Supplies',
        is_hot: true,
        sku: 'PRINT-001'
      }
    ];

    // Check if products already exist
    const [productRows] = await connection.execute('SELECT COUNT(*) as count FROM products');
    
    if (productRows[0].count === 0) {
      for (const product of sampleProducts) {
        await connection.execute(
          'INSERT INTO products (title, description, price, category, is_hot, in_stock, sku) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [product.title, product.description, product.price, product.category, product.is_hot, true, product.sku]
        );
      }
      console.log('✅ Sample products inserted');
    } else {
      console.log('✅ Products already exist');
    }

  } catch (error) {
    console.error('❌ Error inserting initial data:', error);
    throw error;
  }
}

// Export function
module.exports = {
  initializeDatabase
};

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('\n🎉 Database setup complete!');
      console.log('\nDefault Admin Account:');
      console.log('  Email: admin@syntaxdropshipping.com');
      console.log('  Password: admin123');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error);
      process.exit(1);
    });
}