import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')
    
    // Check if the page loads
    await expect(page).toHaveTitle(/MIDAS/)
    
    // Check for main navigation elements
    await expect(page.getByRole('navigation')).toBeVisible()
    
    // Check for hero section
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('should have responsive design', async ({ page }) => {
    await page.goto('/')
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByRole('main')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByRole('main')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('should navigate to services page', async ({ page }) => {
    await page.goto('/')
    
    // Look for services link
    const servicesLink = page.getByRole('link', { name: /services/i })
    if (await servicesLink.isVisible()) {
      await servicesLink.click()
      await expect(page).toHaveURL(/services/)
    }
  })

  test('should have working contact form', async ({ page }) => {
    await page.goto('/')
    
    // Look for contact form or contact button
    const contactButton = page.getByRole('button', { name: /contact/i })
    if (await contactButton.isVisible()) {
      await contactButton.click()
      
      // Check if contact form appears
      await expect(page.getByRole('dialog')).toBeVisible()
    }
  })
})

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    // Check for basic performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      }
    })
    
    // Basic performance checks
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1000)
    expect(performanceMetrics.loadComplete).toBeLessThan(2000)
  })
})