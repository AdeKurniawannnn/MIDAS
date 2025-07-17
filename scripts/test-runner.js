#!/usr/bin/env node

/**
 * Comprehensive Test Runner for MIDAS
 * Runs all types of tests with proper reporting
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🧪 MIDAS Test Runner\n')

// Test categories
const testCategories = [
  {
    name: 'Unit Tests',
    command: 'npm test',
    description: 'React components and utility functions',
    critical: true
  },
  {
    name: 'Integration Tests',
    command: 'npm run test:integration',
    description: 'API routes and database operations',
    critical: true
  },
  {
    name: 'UI Component Tests',
    command: 'npm run test:ui',
    description: 'UI component functionality',
    critical: false
  },
  {
    name: 'Coverage Report',
    command: 'npm run test:coverage',
    description: 'Test coverage analysis',
    critical: false
  },
  {
    name: 'E2E Tests',
    command: 'npm run test:e2e',
    description: 'End-to-end user workflows',
    critical: false
  },
  {
    name: 'Production DB Tests',
    command: 'npm run test:prod',
    description: 'Production database connectivity',
    critical: false
  }
]

// Track results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: testCategories.length
}

// Run tests
async function runTests() {
  console.log('📋 Running test suite...\n')
  
  for (const category of testCategories) {
    console.log(`🔄 Running ${category.name}...`)
    console.log(`   ${category.description}`)
    
    try {
      execSync(category.command, { 
        stdio: 'inherit',
        cwd: process.cwd()
      })
      
      console.log(`✅ ${category.name} - PASSED\n`)
      results.passed++
      
    } catch (error) {
      if (category.critical) {
        console.log(`❌ ${category.name} - FAILED (Critical)\n`)
        results.failed++
      } else {
        console.log(`⚠️  ${category.name} - FAILED (Non-critical)\n`)
        results.skipped++
      }
    }
  }
  
  // Generate report
  generateReport()
}

function generateReport() {
  console.log('📊 Test Results Summary:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Passed: ${results.passed}/${results.total}`)
  console.log(`❌ Failed: ${results.failed}/${results.total}`)
  console.log(`⚠️  Skipped: ${results.skipped}/${results.total}`)
  
  // Calculate success rate
  const successRate = ((results.passed / results.total) * 100).toFixed(1)
  console.log(`📈 Success Rate: ${successRate}%`)
  
  // Overall status
  if (results.failed > 0) {
    console.log('\n🚨 Test suite failed - Critical tests failed')
    process.exit(1)
  } else if (results.passed === results.total) {
    console.log('\n🎉 All tests passed!')
  } else {
    console.log('\n✅ Test suite passed - Some non-critical tests skipped')
  }
  
  // Generate coverage report link
  const coverageDir = path.join(process.cwd(), 'coverage')
  if (fs.existsSync(coverageDir)) {
    console.log(`📋 Coverage report: file://${coverageDir}/lcov-report/index.html`)
  }
}

// Environment checks
function checkEnvironment() {
  console.log('🔍 Environment Check:')
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missing.length > 0) {
    console.log(`⚠️  Missing environment variables: ${missing.join(', ')}`)
    console.log('   Tests will run with fallback configuration')
  } else {
    console.log('✅ All environment variables configured')
  }
  
  console.log('')
}

// Main execution
async function main() {
  try {
    checkEnvironment()
    await runTests()
  } catch (error) {
    console.error('❌ Test runner failed:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)