const fs = require('fs').promises;
const path = require('path');
const { initializeProducts } = require('./utils/dataManager');

async function initializeData() {
  console.log('🚀 Initializing Syntax Dropshipping data...');

  try {
    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    try {
      await fs.access(dataDir);
    } catch (error) {
      await fs.mkdir(dataDir, { recursive: true });
      console.log('✅ Created data directory');
    }

    // Initialize products
    await initializeProducts();
    console.log('✅ Products initialized');

    // Create sample admin user (optional)
    const usersFile = path.join(dataDir, 'users.json');
    try {
      await fs.access(usersFile);
      console.log('✅ Users file already exists');
    } catch (error) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const adminUser = {
        id: 'admin-1',
        email: 'admin@syntaxdropshipping.com',
        password: hashedPassword,
        name: 'Admin User',
        company: 'Syntax Dropshipping',
        role: 'admin',
        createdAt: new Date().toISOString(),
        isActive: true
      };

      await fs.writeFile(usersFile, JSON.stringify([adminUser], null, 2));
      console.log('✅ Admin user created (admin@syntaxdropshipping.com / admin123)');
    }

    console.log('');
    console.log('🎉 Data initialization complete!');
    console.log('');
    console.log('Default Admin Account:');
    console.log('  Email: admin@syntaxdropshipping.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('You can now start the server with: npm run server');

  } catch (error) {
    console.error('❌ Error initializing data:', error);
    process.exit(1);
  }
}

// Run initialization
initializeData();