const { initializeAdmin } = require('../utils/initAdmin');

async function main() {
  try {
    console.log('🚀 Initializing admin account...');
    await initializeAdmin();
    console.log('✅ Admin initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize admin:', error);
    process.exit(1);
  }
}

main();
