import { authHelpers } from '../auth-helpers'

describe('Auth Helpers', () => {
  describe('validateEmail', () => {
    test('validates correct email formats', () => {
      expect(authHelpers.validateEmail('test@example.com')).toBe(true)
      expect(authHelpers.validateEmail('user.name@domain.co.uk')).toBe(true)
      expect(authHelpers.validateEmail('user+tag@example.org')).toBe(true)
    })

    test('rejects invalid email formats', () => {
      expect(authHelpers.validateEmail('invalid-email')).toBe(false)
      expect(authHelpers.validateEmail('user@')).toBe(false)
      expect(authHelpers.validateEmail('@domain.com')).toBe(false)
      expect(authHelpers.validateEmail('user@domain')).toBe(false)
      expect(authHelpers.validateEmail('')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    test('validates strong passwords', () => {
      const result = authHelpers.validatePassword('StrongPass123')
      expect(result.isValid).toBe(true)
      expect(result.message).toBe('Password valid')
    })

    test('rejects passwords that are too short', () => {
      const result = authHelpers.validatePassword('Ab1')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('Password minimal 6 karakter')
    })

    test('rejects passwords that are too long', () => {
      const longPassword = 'a'.repeat(129) + 'A1'
      const result = authHelpers.validatePassword(longPassword)
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('Password maksimal 128 karakter')
    })

    test('rejects passwords without uppercase letters', () => {
      const result = authHelpers.validatePassword('weakpass123')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('Password harus mengandung huruf besar, huruf kecil, dan angka')
    })

    test('rejects passwords without lowercase letters', () => {
      const result = authHelpers.validatePassword('WEAKPASS123')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('Password harus mengandung huruf besar, huruf kecil, dan angka')
    })

    test('rejects passwords without numbers', () => {
      const result = authHelpers.validatePassword('WeakPassword')
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('Password harus mengandung huruf besar, huruf kecil, dan angka')
    })
  })

  describe('hashPassword', () => {
    test('hashes passwords correctly', async () => {
      const password = 'TestPassword123'
      const hashedPassword = await authHelpers.hashPassword(password)
      
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword).toMatch(/^\$2[aby]\$/)
      expect(hashedPassword.length).toBeGreaterThan(50)
    })

    test('generates different hashes for same password', async () => {
      const password = 'TestPassword123'
      const hash1 = await authHelpers.hashPassword(password)
      const hash2 = await authHelpers.hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    test('verifies correct password', async () => {
      const password = 'TestPassword123'
      const hashedPassword = await authHelpers.hashPassword(password)
      
      const result = await authHelpers.verifyPassword(password, hashedPassword)
      expect(result).toBe(true)
    })

    test('rejects incorrect password', async () => {
      const password = 'TestPassword123'
      const wrongPassword = 'WrongPassword123'
      const hashedPassword = await authHelpers.hashPassword(password)
      
      const result = await authHelpers.verifyPassword(wrongPassword, hashedPassword)
      expect(result).toBe(false)
    })
  })
})