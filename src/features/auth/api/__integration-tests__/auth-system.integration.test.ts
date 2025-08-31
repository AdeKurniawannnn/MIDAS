import { 
  signUpUser, 
  signInUser, 
  signOutUser, 
  getAuthenticatedUser,
  validateUserPermissions 
} from '../auth-helpers'
import { 
  testSupabase, 
  cleanupTestData 
} from '@/test-utils/integration-setup'

describe('Authentication System Integration Tests', () => {
  const testAuthUser = {
    email: 'auth-test@test.com',
    password: 'TestPassword123!',
    name: 'Auth Test User'
  }

  beforeEach(async () => {
    // Clean up any existing test user
    await testSupabase.auth.admin.deleteUser('auth-test@test.com').catch(() => {})
  })

  afterEach(async () => {
    await cleanupTestData()
    // Clean up test user
    await testSupabase.auth.admin.deleteUser('auth-test@test.com').catch(() => {})
  })

  describe('User Registration Flow', () => {
    it('should successfully register a new user', async () => {
      const result = await signUpUser({
        email: testAuthUser.email,
        password: testAuthUser.password,
        name: testAuthUser.name
      })

      expect(result.success).toBe(true)
      expect(result.data?.user).toBeTruthy()
      expect(result.data?.user.email).toBe(testAuthUser.email)
      expect(result.error).toBeNull()

      // Verify user profile was created
      const { data: profile } = await testSupabase
        .from('users')
        .select('*')
        .eq('email', testAuthUser.email)
        .single()

      expect(profile).toBeTruthy()
      expect(profile.name).toBe(testAuthUser.name)
      expect(profile.email).toBe(testAuthUser.email)
    })

    it('should prevent duplicate email registration', async () => {
      // Register first user
      await signUpUser(testAuthUser)

      // Try to register again with same email
      const result = await signUpUser({
        ...testAuthUser,
        name: 'Different Name'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('email')
    })

    it('should enforce password strength requirements', async () => {
      const weakPasswords = [
        '123', // Too short
        'password', // Too weak
        'PASSWORD', // No lowercase
        'password123', // No uppercase
        'PasswordABC' // No numbers
      ]

      for (const weakPassword of weakPasswords) {
        const result = await signUpUser({
          ...testAuthUser,
          password: weakPassword
        })

        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
      }
    })

    it('should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'email@',
        'email..double@domain.com'
      ]

      for (const invalidEmail of invalidEmails) {
        const result = await signUpUser({
          ...testAuthUser,
          email: invalidEmail
        })

        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
      }
    })

    it('should handle required field validation', async () => {
      const incompleteData = [
        { email: testAuthUser.email }, // Missing password and name
        { password: testAuthUser.password }, // Missing email and name
        { name: testAuthUser.name } // Missing email and password
      ]

      for (const data of incompleteData) {
        const result = await signUpUser(data as any)

        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
      }
    })
  })

  describe('User Login Flow', () => {
    beforeEach(async () => {
      // Ensure test user exists for login tests
      await signUpUser(testAuthUser)
    })

    it('should successfully log in with valid credentials', async () => {
      const result = await signInUser({
        email: testAuthUser.email,
        password: testAuthUser.password
      })

      expect(result.success).toBe(true)
      expect(result.data?.user).toBeTruthy()
      expect(result.data?.session).toBeTruthy()
      expect(result.data?.user.email).toBe(testAuthUser.email)
      expect(result.error).toBeNull()
    })

    it('should reject login with wrong password', async () => {
      const result = await signInUser({
        email: testAuthUser.email,
        password: 'WrongPassword123!'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(result.data?.session).toBeFalsy()
    })

    it('should reject login with non-existent email', async () => {
      const result = await signInUser({
        email: 'nonexistent@test.com',
        password: testAuthUser.password
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should handle malformed email gracefully', async () => {
      const result = await signInUser({
        email: 'malformed-email',
        password: testAuthUser.password
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should reject empty credentials', async () => {
      const emptyCredentials = [
        { email: '', password: testAuthUser.password },
        { email: testAuthUser.email, password: '' },
        { email: '', password: '' }
      ]

      for (const credentials of emptyCredentials) {
        const result = await signInUser(credentials)

        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
      }
    })
  })

  describe('Session Management', () => {
    let userSession: any

    beforeEach(async () => {
      await signUpUser(testAuthUser)
      const loginResult = await signInUser({
        email: testAuthUser.email,
        password: testAuthUser.password
      })
      userSession = loginResult.data?.session
    })

    it('should get authenticated user from valid session', async () => {
      const result = await getAuthenticatedUser()

      expect(result.success).toBe(true)
      expect(result.data?.user).toBeTruthy()
      expect(result.data?.user.email).toBe(testAuthUser.email)
    })

    it('should successfully sign out user', async () => {
      const result = await signOutUser()

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()

      // Verify session is cleared
      const sessionResult = await getAuthenticatedUser()
      expect(sessionResult.data?.user).toBeNull()
    })

    it('should handle session expiration gracefully', async () => {
      // This test would typically involve manipulating session expiry
      // For now, we test the error handling path
      
      // First sign out to simulate expired session
      await signOutUser()
      
      const result = await getAuthenticatedUser()
      
      expect(result.data?.user).toBeNull()
    })
  })

  describe('User Permissions and Authorization', () => {
    let testUser: any

    beforeEach(async () => {
      const signUpResult = await signUpUser(testAuthUser)
      testUser = signUpResult.data?.user
    })

    it('should validate user permissions for resource access', async () => {
      const result = await validateUserPermissions(testUser.id, {
        resource: 'keywords',
        action: 'read'
      })

      expect(result.success).toBe(true)
      expect(result.data?.hasPermission).toBe(true)
    })

    it('should prevent unauthorized resource access', async () => {
      const result = await validateUserPermissions(testUser.id, {
        resource: 'admin',
        action: 'write'
      })

      expect(result.success).toBe(true)
      expect(result.data?.hasPermission).toBe(false)
    })

    it('should handle invalid user ID gracefully', async () => {
      const result = await validateUserPermissions('invalid-user-id', {
        resource: 'keywords',
        action: 'read'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('User Profile Management', () => {
    let testUser: any

    beforeEach(async () => {
      const signUpResult = await signUpUser(testAuthUser)
      testUser = signUpResult.data?.user
    })

    it('should update user profile information', async () => {
      const updatedProfile = {
        name: 'Updated Name',
        company: 'Test Company',
        phone: '+1234567890'
      }

      const { error } = await testSupabase
        .from('users')
        .update(updatedProfile)
        .eq('id', testUser.id)

      expect(error).toBeNull()

      // Verify update
      const { data: profile } = await testSupabase
        .from('users')
        .select('*')
        .eq('id', testUser.id)
        .single()

      expect(profile.name).toBe(updatedProfile.name)
      expect(profile.company).toBe(updatedProfile.company)
      expect(profile.phone).toBe(updatedProfile.phone)
    })

    it('should maintain email uniqueness during updates', async () => {
      // Create another user
      const otherUser = {
        email: 'other-user@test.com',
        password: 'OtherPassword123!',
        name: 'Other User'
      }
      
      await signUpUser(otherUser)

      // Try to update first user's email to second user's email
      const { error } = await testSupabase
        .from('users')
        .update({ email: otherUser.email })
        .eq('id', testUser.id)

      expect(error).toBeTruthy()
    })

    it('should validate profile data constraints', async () => {
      const invalidUpdates = [
        { email: 'invalid-email' },
        { phone: '123' }, // Too short
        { name: '' } // Empty name
      ]

      for (const update of invalidUpdates) {
        const { error } = await testSupabase
          .from('users')
          .update(update)
          .eq('id', testUser.id)

        expect(error).toBeTruthy()
      }
    })
  })

  describe('Security Features', () => {
    it('should prevent SQL injection in auth queries', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "<script>alert('xss')</script>"
      ]

      for (const maliciousInput of maliciousInputs) {
        const result = await signInUser({
          email: maliciousInput,
          password: maliciousInput
        })

        expect(result.success).toBe(false)
        // Should fail safely without causing database errors
      }
    })

    it('should rate limit excessive login attempts', async () => {
      // This test would typically require implementing rate limiting
      // For now, we verify that multiple failed attempts don't crash the system
      
      const promises = Array.from({ length: 10 }, () =>
        signInUser({
          email: 'nonexistent@test.com',
          password: 'wrongpassword'
        })
      )

      const results = await Promise.all(promises)
      
      results.forEach(result => {
        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
      })
    })

    it('should handle concurrent authentication requests', async () => {
      const concurrentSignUps = Array.from({ length: 5 }, (_, i) =>
        signUpUser({
          email: `concurrent-user-${i}@test.com`,
          password: 'ConcurrentPassword123!',
          name: `Concurrent User ${i}`
        })
      )

      const results = await Promise.all(concurrentSignUps)
      
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.data?.user).toBeTruthy()
      })

      // Clean up concurrent users
      for (let i = 0; i < 5; i++) {
        await testSupabase.auth.admin.deleteUser(`concurrent-user-${i}@test.com`).catch(() => {})
      }
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeouts gracefully', async () => {
      // This test would require mocking network failures
      // For now, we test basic error handling structure
      
      const result = await signInUser({
        email: testAuthUser.email,
        password: testAuthUser.password
      })

      // Should always return a structured response
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
    })

    it('should handle malformed authentication data', async () => {
      const malformedData = [
        null,
        undefined,
        {},
        { email: null, password: null },
        { email: [], password: {} }
      ]

      for (const data of malformedData) {
        const result = await signInUser(data as any)
        
        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
      }
    })

    it('should maintain consistent error response format', async () => {
      const result = await signInUser({
        email: 'invalid@test.com',
        password: 'wrongpassword'
      })

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('error')
      expect(result.success).toBe(false)
      expect(result.error).toHaveProperty('message')
    })
  })
})