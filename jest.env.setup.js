
// Jest environment setup for integration tests
const dotenv = require('dotenv')

// Load test environment variables
dotenv.config({ path: '.env.test' })
dotenv.config({ path: '.env.test.local' })

// Set default test environment variables
process.env.NODE_ENV = 'test'
process.env.TEST_ENVIRONMENT = 'true'

// Mock external APIs by default
if (!process.env.MOCK_EXTERNAL_APIS) {
  process.env.MOCK_EXTERNAL_APIS = 'true'
}

// Ensure test database configuration
if (!process.env.TEST_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.TEST_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
}

if (!process.env.TEST_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.TEST_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

// Suppress console logs during tests unless debugging
if (process.env.TEST_VERBOSE !== 'true') {
  console.warn = () => {}
  console.info = () => {}
  console.debug = () => {}
}

console.log('📊 Integration test environment configured')
