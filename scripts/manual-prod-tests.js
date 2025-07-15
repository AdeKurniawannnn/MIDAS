#!/usr/bin/env node

/**
 * Manual Production Database Testing Commands
 * 
 * Interactive testing utilities for production database
 */

const { execSync } = require('child_process');
const readline = require('readline');

// Load environment variables
require('dotenv').config({ path: '.env.test' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 MIDAS Production Database Manual Testing\n');

const commands = {
  '1': {
    name: 'Test Database Connection',
    description: 'Verify connection to production database',
    action: testConnection
  },
  '2': {
    name: 'Create Test User',
    description: 'Create a test user in production database',
    action: createTestUser
  },
  '3': {
    name: 'Test User Login',
    description: 'Test login with existing user',
    action: testLogin
  },
  '4': {
    name: 'List Test Users',
    description: 'Show all test users in database',
    action: listTestUsers
  },
  '5': {
    name: 'Clean Test Data',
    description: 'Remove all test users from database',
    action: cleanTestData
  },
  '6': {
    name: 'Test Registration Flow',
    description: 'Full registration and login test',
    action: testRegistrationFlow
  },
  '7': {
    name: 'Test Data Scraping',
    description: 'Test Instagram scraping functionality',
    action: testScraping
  },
  '8': {
    name: 'Database Stats',
    description: 'Show database statistics',
    action: showStats
  },
  'q': {
    name: 'Quit',
    description: 'Exit the testing tool',
    action: quit
  }
};

function showMenu() {
  console.log('\n📋 Available Commands:');
  Object.entries(commands).forEach(([key, cmd]) => {
    console.log(`  ${key}. ${cmd.name} - ${cmd.description}`);
  });
  console.log('');
}

async function testConnection() {
  console.log('🔄 Testing database connection...\n');
  
  const script = `
    const { testHelpers } = require('./src/lib/test-utils.ts');
    testHelpers.verifyConnection().then(result => {
      if (result) {
        console.log('✅ Successfully connected to production database');
      } else {
        console.log('❌ Failed to connect to production database');
      }
    }).catch(err => {
      console.error('❌ Connection error:', err.message);
    });
  `;
  
  try {
    execSync(`node -e "${script}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function createTestUser() {
  console.log('🔄 Creating test user...\n');
  
  const script = `
    const { testHelpers } = require('./src/lib/test-utils.ts');
    
    testHelpers.createTestUser({
      nama_lengkap: 'Manual Test User',
      email: 'manual-test-' + Date.now() + '@example.com',
      password: 'TestPass123!',
      perusahaan: 'Test Company',
      no_telepon: '08123456789'
    }).then(user => {
      console.log('✅ Test user created successfully:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Name:', user.nama_lengkap);
    }).catch(err => {
      console.error('❌ Failed to create test user:', err.message);
    });
  `;
  
  try {
    execSync(`node -e "${script}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testLogin() {
  return new Promise((resolve) => {
    rl.question('Enter email to test: ', (email) => {
      rl.question('Enter password: ', (password) => {
        console.log('🔄 Testing login...\n');
        
        const script = `
          const { authHelpers } = require('./src/lib/auth/auth-helpers.ts');
          
          authHelpers.loginUser({
            email: '${email}',
            password: '${password}'
          }).then(result => {
            if (result.success) {
              console.log('✅ Login successful:');
              console.log('   User ID:', result.data.id);
              console.log('   Name:', result.data.nama_lengkap);
              console.log('   Email:', result.data.email);
            } else {
              console.log('❌ Login failed:', result.error);
            }
          }).catch(err => {
            console.error('❌ Login error:', err.message);
          });
        `;
        
        try {
          execSync(`node -e "${script}"`, { stdio: 'inherit' });
        } catch (error) {
          console.error('❌ Test failed:', error.message);
        }
        
        resolve();
      });
    });
  });
}

async function listTestUsers() {
  console.log('🔄 Listing test users...\n');
  
  const script = `
    const { testHelpers } = require('./src/lib/test-utils.ts');
    
    testHelpers.getTestStats().then(stats => {
      console.log('📊 Test Users Statistics:');
      console.log('   Total test users:', stats.testUsersCount);
      
      if (stats.testUsers.length > 0) {
        console.log('\\n📋 Test Users:');
        stats.testUsers.forEach((user, index) => {
          console.log('   ' + (index + 1) + '. ' + user.email + ' (ID: ' + user.id + ')');
        });
      } else {
        console.log('   No test users found');
      }
    }).catch(err => {
      console.error('❌ Failed to get test stats:', err.message);
    });
  `;
  
  try {
    execSync(`node -e "${script}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function cleanTestData() {
  return new Promise((resolve) => {
    rl.question('Are you sure you want to delete all test users? (yes/no): ', (answer) => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        console.log('🔄 Cleaning test data...\n');
        
        const script = `
          const { testHelpers } = require('./src/lib/test-utils.ts');
          
          testHelpers.cleanupTestUsers().then(() => {
            console.log('✅ All test users have been deleted');
          }).catch(err => {
            console.error('❌ Failed to clean test data:', err.message);
          });
        `;
        
        try {
          execSync(`node -e "${script}"`, { stdio: 'inherit' });
        } catch (error) {
          console.error('❌ Test failed:', error.message);
        }
      } else {
        console.log('🚫 Cleanup cancelled');
      }
      
      resolve();
    });
  });
}

async function testRegistrationFlow() {
  console.log('🔄 Testing complete registration flow...\n');
  
  const script = `
    const { testHelpers, testSetup } = require('./src/lib/test-utils.ts');
    const { authHelpers } = require('./src/lib/auth/auth-helpers.ts');
    
    async function fullTest() {
      try {
        // Setup
        await testSetup.beforeAll();
        
        // Create user
        const testUser = await testHelpers.createTestUser({
          nama_lengkap: 'Full Test User',
          email: 'full-test-' + Date.now() + '@example.com',
          password: 'FullTest123!',
          perusahaan: 'Full Test Company'
        });
        
        console.log('✅ Step 1: User registration successful');
        console.log('   Email:', testUser.email);
        
        // Test login
        const loginResult = await authHelpers.loginUser({
          email: testUser.email,
          password: testUser.password
        });
        
        if (!loginResult.success) {
          throw new Error('Login failed: ' + loginResult.error);
        }
        
        console.log('✅ Step 2: User login successful');
        
        // Test user retrieval
        const userResult = await authHelpers.getUserById(testUser.id);
        
        if (!userResult.success) {
          throw new Error('User retrieval failed: ' + userResult.error);
        }
        
        console.log('✅ Step 3: User data retrieval successful');
        
        // Cleanup
        await testHelpers.cleanupTestUser(testUser.id);
        console.log('✅ Step 4: Test cleanup successful');
        
        console.log('\\n🎉 Full registration flow test completed successfully!');
        
      } catch (error) {
        console.error('❌ Full test failed:', error.message);
      }
    }
    
    fullTest();
  `;
  
  try {
    execSync(`node -e "${script}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testScraping() {
  console.log('🔄 Testing Instagram scraping...\n');
  
  const script = `
    const { testSupabase } = require('./src/lib/test-utils.ts');
    
    testSupabase
      .from('data_screping_instagram')
      .select('*')
      .limit(5)
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Scraping data query failed:', error.message);
          return;
        }
        
        console.log('✅ Scraping data query successful');
        console.log('   Records found:', data?.length || 0);
        
        if (data && data.length > 0) {
          console.log('\\n📋 Sample Records:');
          data.forEach((record, index) => {
            console.log('   ' + (index + 1) + '. ' + (record.username || 'N/A') + ' - ' + (record.followersCount || 'N/A') + ' followers');
          });
        }
      });
  `;
  
  try {
    execSync(`node -e "${script}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function showStats() {
  console.log('🔄 Getting database statistics...\n');
  
  const script = `
    const { testSupabase } = require('./src/lib/test-utils.ts');
    
    async function getStats() {
      try {
        // Get user count
        const { data: users, error: userError } = await testSupabase
          .from('Mida_Login')
          .select('id, email, created_at, status');
        
        if (userError) throw userError;
        
        // Get scraping data count
        const { data: scraping, error: scrapingError } = await testSupabase
          .from('data_screping_instagram')
          .select('id, username, created_at');
        
        if (scrapingError) throw scrapingError;
        
        console.log('📊 Database Statistics:');
        console.log('   Total users:', users?.length || 0);
        console.log('   Active users:', users?.filter(u => u.status === 'active').length || 0);
        console.log('   Scraping records:', scraping?.length || 0);
        
        // Recent activity
        const recentUsers = users?.filter(u => {
          const created = new Date(u.created_at);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return created > dayAgo;
        }) || [];
        
        console.log('   New users (24h):', recentUsers.length);
        
        if (recentUsers.length > 0) {
          console.log('\\n👥 Recent Users:');
          recentUsers.forEach((user, index) => {
            console.log('   ' + (index + 1) + '. ' + user.email);
          });
        }
        
      } catch (error) {
        console.error('❌ Stats query failed:', error.message);
      }
    }
    
    getStats();
  `;
  
  try {
    execSync(`node -e "${script}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function quit() {
  console.log('👋 Goodbye!');
  rl.close();
  process.exit(0);
}

async function main() {
  console.log('⚠️  WARNING: This tool connects to the PRODUCTION database!');
  console.log('   Use with caution and only in controlled environments.\n');
  
  while (true) {
    showMenu();
    
    const choice = await new Promise((resolve) => {
      rl.question('Enter command (1-8, q): ', resolve);
    });
    
    const command = commands[choice];
    
    if (command) {
      await command.action();
    } else {
      console.log('❌ Invalid command. Please try again.');
    }
  }
}

main().catch(console.error);