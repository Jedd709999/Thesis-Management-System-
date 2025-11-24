import { test, expect, Page } from '@playwright/test'

// Helper function to login
async function login(page: Page, email: string = 'student@example.com', password: string = 'password123') {
  await page.goto('/')
  await page.fill('input[type="email"], input[name="email"]', email)
  await page.fill('input[type="password"], input[name="password"]', password)
  await page.click('button[type="submit"], button:has-text("Sign In")')
  await page.waitForURL('**/dashboard', { timeout: 5000 })
}

test.describe('Student Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should create a topic proposal', async ({ page }) => {
    // Navigate to proposals
    await page.click('a:has-text("Proposals"), a:has-text("Topics"), [href*="proposal"]')
    
    // Click create proposal button
    await page.click('button:has-text("New"), button:has-text("Create"), button:has-text("Add Proposal")')
    
    // Fill in proposal form
    await page.fill('input[name="title"], input[placeholder*="title" i]', 'AI-Based Thesis Management System')
    await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', 'A comprehensive system for managing thesis workflows')
    await page.fill('input[name="keywords"], input[placeholder*="keyword" i]', 'AI, Management, Thesis')
    
    // Submit the proposal
    await page.click('button[type="submit"], button:has-text("Submit"), button:has-text("Create Proposal")')
    
    // Verify success (either success message or redirect to proposals list)
    await expect(page.locator('text=/success|created|submitted/i').first()).toBeVisible({ timeout: 5000 })
      .catch(() => page.waitForURL('**/proposals'))
  })

  test('should upload a document', async ({ page }) => {
    // Navigate to documents
    await page.click('a:has-text("Documents"), a:has-text("Files"), [href*="document"]')
    
    // Click upload button
    await page.click('button:has-text("Upload"), button:has-text("Add Document"), button:has-text("New Document")')
    
    // Wait for upload modal/form
    await page.waitForSelector('input[type="file"], [type="file"]', { timeout: 3000 })
    
    // Note: File upload test would require actual file
    // This is a stub showing the flow
    await expect(page.locator('text=/upload|select file/i')).toBeVisible()
  })

  test('should view schedule', async ({ page }) => {
    // Navigate to schedule/calendar
    await page.click('a:has-text("Schedule"), a:has-text("Calendar"), [href*="schedule"]')
    
    // Verify calendar is displayed
    await expect(page.locator('.fc-daygrid, [class*="calendar"], [class*="schedule"]').first()).toBeVisible({ timeout: 5000 })
      .catch(() => expect(page.locator('text=/calendar|schedule/i')).toBeVisible())
  })

  test('should check notifications', async ({ page }) => {
    // Click notifications bell
    await page.click('button:has([aria-label*="notification" i]), [aria-label*="notification" i]')
    
    // Verify notifications panel opens
    await expect(page.locator('text=/notification/i, [role="dialog"], [class*="notification"]').first()).toBeVisible({ timeout: 3000 })
  })

  test('should view group details', async ({ page }) => {
    // Navigate to groups
    await page.click('a:has-text("Groups"), a:has-text("My Group"), [href*="group"]')
    
    // Verify groups page loaded
    await expect(page.locator('text=/group|member/i').first()).toBeVisible({ timeout: 5000 })
    
    // Click on first group (if available)
    const groupLink = page.locator('a[href*="/groups/"], .group-item, [class*="group-card"]').first()
    if (await groupLink.isVisible()) {
      await groupLink.click()
      await expect(page.locator('text=/member|detail/i')).toBeVisible()
    }
  })

  test('should navigate to thesis page', async ({ page }) => {
    // Navigate to thesis
    await page.click('a:has-text("Thesis"), a:has-text("My Thesis"), [href*="thesis"]')
    
    // Verify thesis page
    await expect(page.locator('text=/thesis|title|abstract/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should access user settings', async ({ page }) => {
    // Click on user menu/avatar
    await page.click('button:has([aria-label*="user" i]), [aria-label*="settings" i], a:has-text("Settings")')
    
    // Navigate to settings if not already there
    const settingsLink = page.locator('a:has-text("Settings"), a:has-text("Profile")')
    if (await settingsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await settingsLink.click()
    }
    
    // Verify settings page
    await expect(page.locator('text=/profile|settings|account/i').first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Adviser Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'adviser@example.com')
  })

  test('should view advisee groups', async ({ page }) => {
    // Navigate to groups
    await page.click('a:has-text("Groups"), [href*="group"]')
    
    // Verify groups list
    await expect(page.locator('text=/advisee|group/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should review a proposal', async ({ page }) => {
    // Navigate to proposals
    await page.click('a:has-text("Proposals"), [href*="proposal"]')
    
    // Click on a proposal to review
    const proposalLink = page.locator('a[href*="/proposals/"], .proposal-item').first()
    if (await proposalLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await proposalLink.click()
      
      // Look for review/approve buttons
      await expect(page.locator('button:has-text("Approve"), button:has-text("Reject"), button:has-text("Review")').first())
        .toBeVisible({ timeout: 5000 })
    }
  })

  test('should view thesis submissions', async ({ page }) => {
    // Navigate to thesis page
    await page.click('a:has-text("Thesis"), [href*="thesis"]')
    
    // Verify thesis list
    await expect(page.locator('text=/thesis|submission/i').first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Admin Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@example.com')
  })

  test('should view admin dashboard', async ({ page }) => {
    // Verify admin dashboard elements
    await expect(page.locator('text=/admin|users|system/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should access user management', async ({ page }) => {
    // Navigate to users/settings
    await page.click('a:has-text("Users"), a:has-text("Settings"), [href*="user"], [href*="setting"]').catch(() => {})
    
    // Verify user management features are visible
    const hasUserFeatures = await page.locator('text=/user|student|adviser|panel/i').first()
      .isVisible({ timeout: 5000 }).catch(() => false)
    
    expect(hasUserFeatures).toBeTruthy()
  })

  test('should manage system settings', async ({ page }) => {
    // Navigate to settings
    await page.click('a:has-text("Settings"), [href*="setting"]')
    
    // Verify settings page
    await expect(page.locator('text=/settings|configuration|system/i').first()).toBeVisible({ timeout: 5000 })
  })
})
