import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/Thesis Management/)
    await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: /sign in|login/i }).first()).toBeVisible()
  })

  test('should login with valid credentials', async ({ page }) => {
    // Fill in email
    await page.fill('input[type="email"], input[name="email"]', 'student@example.com')
    
    // Fill in password
    await page.fill('input[type="password"], input[name="password"]', 'password123')
    
    // Click login button
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")')
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 })
    
    // Verify we're on the dashboard
    await expect(page.locator('text=/dashboard|welcome/i')).toBeVisible({ timeout: 5000 })
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com')
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword')
    
    // Click login button
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")')
    
    // Wait for error message
    await expect(page.locator('text=/invalid|error|wrong/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should navigate to signup page', async ({ page }) => {
    // Click on signup link
    await page.click('a:has-text("Sign Up"), a:has-text("Register"), a:has-text("Create Account")')
    
    // Verify we're on signup page
    await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: /sign up|register|create account/i }).first()).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"], input[name="email"]', 'student@example.com')
    await page.fill('input[type="password"], input[name="password"]', 'password123')
    await page.click('button[type="submit"], button:has-text("Sign In")')
    
    await page.waitForURL('**/dashboard')
    
    // Find and click logout button
    await page.click('button:has-text("Logout"), button:has-text("Sign Out"), [aria-label*="logout" i]')
    
    // Verify we're back on login page
    await expect(page.locator('h1, h2, h3, h4, h5, h6').filter({ hasText: /sign in|login/i }).first()).toBeVisible({ timeout: 5000 })
  })
})
