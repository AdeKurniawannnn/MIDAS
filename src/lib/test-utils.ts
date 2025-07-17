import { createClient } from '@supabase/supabase-js'
import { authHelpers } from '@/lib/auth/auth-helpers'

// Production database client for testing
export const testSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Service role client for admin operations in tests
export const testSupabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Test data generators
export const generateTestUser = (override = {}) => ({
  nama_lengkap: 'Test User',
  email: `test-${Date.now()}@example.com`,
  password: 'Test123!',
  perusahaan: 'Test Company',
  no_telepon: '08123456789',
  ...override
})

// Test helpers
export const testHelpers = {
  // Create test user
  async createTestUser(userData = {}) {
    const testUser = generateTestUser(userData)
    const result = await authHelpers.registerUser(testUser)
    
    if (!result.success) {
      throw new Error(`Failed to create test user: ${result.error}`)
    }
    
    return {
      ...result.data,
      password: testUser.password // Keep password for login tests
    }
  },

  // Clean up test user
  async cleanupTestUser(userId: string) {
    const { error } = await testSupabaseAdmin
      .from('Mida_Login')
      .delete()
      .eq('id', userId)
    
    if (error && process.env.NODE_ENV === 'development') {
      console.warn('Failed to cleanup test user:', error)
    }
  },

  // Clean up test users by email pattern
  async cleanupTestUsers(emailPattern = 'test-') {
    const { error } = await testSupabaseAdmin
      .from('Mida_Login')
      .delete()
      .like('email', `${emailPattern}%`)
    
    if (error && process.env.NODE_ENV === 'development') {
      console.warn('Failed to cleanup test users:', error)
    }
  },

  // Verify database connection
  async verifyConnection() {
    try {
      const { data, error } = await testSupabase
        .from('Mida_Login')
        .select('count')
        .limit(1)
      
      if (error) {
        throw error
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Production database connection verified')
      }
      return true
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Production database connection failed:', error)
      }
      return false
    }
  },

  // Get test statistics
  async getTestStats() {
    const { data, error } = await testSupabase
      .from('Mida_Login')
      .select('id, email, created_at')
      .like('email', 'test-%')
      .order('created_at', { ascending: false })
    
    if (error) {
      throw error
    }
    
    return {
      testUsersCount: data?.length || 0,
      testUsers: data || []
    }
  }
}

// Test database setup and teardown
export const testSetup = {
  async beforeAll() {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Setting up production database tests...')
    }
    
    // Verify connection
    const isConnected = await testHelpers.verifyConnection()
    if (!isConnected) {
      throw new Error('Cannot connect to production database')
    }
    
    // Clean up any existing test data
    await testHelpers.cleanupTestUsers()
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Production database test setup complete')
    }
  },

  async afterAll() {
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Cleaning up production database tests...')
    }
    
    // Clean up test data
    await testHelpers.cleanupTestUsers()
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Production database test cleanup complete')
    }
  },

  async beforeEach() {
    // Optional: Add any per-test setup
  },

  async afterEach() {
    // Optional: Add any per-test cleanup
  }
}

// Mock data for testing
export const testData = {
  validUser: {
    nama_lengkap: 'John Doe',
    email: 'john.doe@example.com',
    password: 'SecurePass123!',
    perusahaan: 'Acme Corp',
    no_telepon: '08123456789'
  },

  invalidUser: {
    nama_lengkap: '',
    email: 'invalid-email',
    password: '123',
    perusahaan: '',
    no_telepon: ''
  },

  loginCredentials: {
    valid: {
      email: 'john.doe@example.com',
      password: 'SecurePass123!'
    },
    invalid: {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    }
  }
}

export default testHelpers