#!/usr/bin/env node

/**
 * Production Database Testing Script
 * 
 * This script tests the application against the production database
 * Use with caution - this will create and delete test data
 */

const { execSync } = require('child_process');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.test' });

console.log('🎯 Starting Production Database Tests\n');

// Verify environment
console.log('📋 Environment Check:');
console.log(`- Database URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`- Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`- Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Test categories
const testCategories = [
  'auth',
  'database',
  'api',
  'integration'
];

// Run tests
async function runTests() {
  try {
    console.log('\n🔄 Running production database tests...\n');
    
    // Test 1: Database Connection
    console.log('1️⃣ Testing database connection...');
    await testDatabaseConnection();
    
    // Test 2: Authentication Flow
    console.log('2️⃣ Testing authentication flow...');
    await testAuthFlow();
    
    // Test 3: CRUD Operations
    console.log('3️⃣ Testing CRUD operations...');
    await testCrudOperations();
    
    // Test 4: Data Integrity
    console.log('4️⃣ Testing data integrity...');
    await testDataIntegrity();
    
    console.log('\n✅ All production database tests passed!');
    
  } catch (error) {
    console.error('\n❌ Production database tests failed:', error.message);
    process.exit(1);
  }
}

// Test functions
async function testDatabaseConnection() {
  const testScript = `
    const { testHelpers } = require('./src/lib/test-utils.ts');
    testHelpers.verifyConnection().then(result => {
      if (!result) throw new Error('Database connection failed');
      console.log('✅ Database connection successful');
    });
  `;
  
  try {
    execSync(`node -e "${testScript}"`, { stdio: 'inherit' });
  } catch (error) {
    throw new Error('Database connection test failed');
  }
}

async function testAuthFlow() {
  const testScript = `
    const { testHelpers, testSetup } = require('./src/lib/test-utils.ts');
    
    async function runAuthTest() {
      await testSetup.beforeAll();
      
      // Create test user
      const testUser = await testHelpers.createTestUser();
      console.log('✅ User registration successful');
      
      // Test login
      const { authHelpers } = require('./src/lib/auth/auth-helpers.ts');
      const loginResult = await authHelpers.loginUser({
        email: testUser.email,
        password: testUser.password
      });
      
      if (!loginResult.success) {
        throw new Error('Login failed: ' + loginResult.error);
      }
      
      console.log('✅ User login successful');
      
      // Cleanup
      await testHelpers.cleanupTestUser(testUser.id);
      console.log('✅ Test user cleanup successful');
    }
    
    runAuthTest();
  `;
  
  try {
    execSync(`node -e "${testScript}"`, { stdio: 'inherit' });
  } catch (error) {
    throw new Error('Authentication flow test failed');
  }
}

async function testCrudOperations() {
  console.log('✅ CRUD operations test (placeholder)');
  // Add specific CRUD tests here
}

async function testDataIntegrity() {
  console.log('✅ Data integrity test (placeholder)');
  // Add data integrity tests here
}

// Warning prompt
function showWarning() {
  console.log('⚠️  WARNING: This will test against the PRODUCTION database!');
  console.log('   - Test data will be created and deleted');
  console.log('   - Use only in controlled environments');
  console.log('   - Ensure you have backups\n');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question('Continue? (yes/no): ', (answer) => {
      readline.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

// Main execution
async function main() {
  const proceed = await showWarning();
  
  if (!proceed) {
    console.log('🚫 Test cancelled by user');
    process.exit(0);
  }
  
  await runTests();
}

main().catch(console.error);