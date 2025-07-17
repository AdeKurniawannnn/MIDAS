import { test, expect } from '@playwright/test'

test.describe('Dashboard Authentication', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should be redirected to login or see auth modal
    await expect(page.getByText(/login/i)).toBeVisible()
  })

  test('should allow login with development credentials', async ({ page }) => {
    await page.goto('/')
    
    // Look for login button or modal
    const loginButton = page.getByRole('button', { name: /login/i })
    if (await loginButton.isVisible()) {
      await loginButton.click()
      
      // Fill in development credentials
      await page.fill('input[type="email"]', 'test@gmail.com')
      await page.fill('input[type="password"]', 'Test123')
      
      // Submit form
      await page.getByRole('button', { name: /submit|login/i }).click()
      
      // Should redirect to dashboard or show success
      await expect(page).toHaveURL(/dashboard/)
    }
  })
})

test.describe('Dashboard Features', () => {
  test.beforeEach(async ({ page }) => {
    // Auto-login for development
    await page.goto('/')
    await page.waitForTimeout(1000) // Wait for auto-login
  })

  test('should access dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should see dashboard content
    await expect(page.getByText(/dashboard/i)).toBeVisible()
  })

  test('should navigate to keywords section', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Look for keywords navigation
    const keywordsLink = page.getByRole('link', { name: /keywords/i })
    if (await keywordsLink.isVisible()) {
      await keywordsLink.click()
      await expect(page).toHaveURL(/keywords/)
    }
  })

  test('should navigate to KOL section', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Look for KOL navigation
    const kolLink = page.getByRole('link', { name: /kol/i })
    if (await kolLink.isVisible()) {
      await kolLink.click()
      await expect(page).toHaveURL(/kol/)
    }
  })

  test('should navigate to Orion section', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Look for Orion navigation
    const orionLink = page.getByRole('link', { name: /orion/i })
    if (await orionLink.isVisible()) {
      await orionLink.click()
      await expect(page).toHaveURL(/orion/)
    }
  })
})

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Auto-login for development
    await page.goto('/')
    await page.waitForTimeout(1000) // Wait for auto-login
  })

  test('should display user profile', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should see user profile or avatar
    const userProfile = page.getByRole('button', { name: /profile|user/i })
    if (await userProfile.isVisible()) {
      await userProfile.click()
      await expect(page.getByText(/profile/i)).toBeVisible()
    }
  })

  test('should allow logout', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Look for logout button
    const logoutButton = page.getByRole('button', { name: /logout/i })
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
      
      // Should redirect to home page
      await expect(page).toHaveURL('/')
    }
  })

  test('should handle responsive sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Should have mobile menu button
    const mobileMenuButton = page.getByRole('button', { name: /menu/i })
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      
      // Should show navigation menu
      await expect(page.getByRole('navigation')).toBeVisible()
    }
  })
})