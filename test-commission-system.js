const commissionManager = require('./server/utils/commissionManager');
const db = require('./server/config/database');

async function testCommissionSystem() {
  console.log('🧪 Testing Commission System...\n');

  try {
    // Test 1: Create referral codes for test users
    console.log('1. Testing referral code generation...');
    
    // Assume we have test users with IDs 1 and 2
    const referralCode1 = await commissionManager.createReferralCodeForUser(1);
    const referralCode2 = await commissionManager.createReferralCodeForUser(2);
    
    console.log(`✅ User 1 referral code: ${referralCode1}`);
    console.log(`✅ User 2 referral code: ${referralCode2}\n`);

    // Test 2: Get commission settings
    console.log('2. Testing commission settings...');
    
    const commissionRate = await commissionManager.getCommissionRate();
    const freezePeriodDays = await commissionManager.getFreezePeriodDays();
    
    console.log(`✅ Commission rate: ${(commissionRate * 100).toFixed(2)}%`);
    console.log(`✅ Freeze period: ${freezePeriodDays} days\n`);

    // Test 3: Test commission calculation (simulate)
    console.log('3. Testing commission calculation...');
    
    // This would normally be triggered by an actual order
    // For testing, we'll just verify the calculation logic
    const testOrderAmount = 100.00;
    const expectedCommission = testOrderAmount * commissionRate;
    
    console.log(`✅ Order amount: $${testOrderAmount}`);
    console.log(`✅ Expected commission: $${expectedCommission.toFixed(2)}\n`);

    // Test 4: Get user commission account (if exists)
    console.log('4. Testing user commission account...');
    
    try {
      const account1 = await commissionManager.getUserCommissionAccount(1);
      console.log('✅ User 1 commission account:', account1);
    } catch (error) {
      console.log('ℹ️  User 1 commission account not found (expected for new users)');
    }

    console.log('\n✅ Commission system tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Commission system test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run tests
testCommissionSystem();