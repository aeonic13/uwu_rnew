import { test, expect } from '@playwright/test'

const API_BASE =
  process.env.SMOKE_API_BASE || 'https://rentra-production.up.railway.app'

// ── Read-only checks: safe on every run, catch dead deploys/regressions ──

test('backend health endpoint responds', async ({ request }) => {
  const res = await request.get(`${API_BASE}/health`)
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.status).toBe('ok')
})

test('home page loads with Rentra branding', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/rentra/i)
  await expect(page.locator('#root')).not.toBeEmpty()
})

test('browse listings page renders', async ({ page }) => {
  await page.goto('/listings')
  // Either real listings or an empty state — but the shell must render.
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect(page.locator('body')).not.toContainText(/something went wrong/i)
})

test('login page renders its form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]').first()).toBeVisible()
})

test('register page shows the account-type chooser', async ({ page }) => {
  await page.goto('/register')
  await expect(page.getByText('Create Your Account')).toBeVisible()
  await expect(page.getByText(/looking for a place to rent/i)).toBeVisible()
  await expect(page.getByText(/list my property/i)).toBeVisible()
})

test('terms and privacy pages are public (Plaid requirement)', async ({
  page,
}) => {
  await page.goto('/terms')
  await expect(
    page.getByRole('heading', { name: 'Terms of Service' })
  ).toBeVisible()
  await page.goto('/privacy')
  await expect(
    page.getByRole('heading', { name: 'Privacy Policy' })
  ).toBeVisible()
})

test('cosigner accept route exists (email link is not dead)', async ({
  page,
}) => {
  await page.goto('/cosigner/accept/smoke-test-invalid-token')
  // An invalid token must show the graceful error, never a blank/404 shell.
  await expect(page.getByText(/invitation/i).first()).toBeVisible({
    timeout: 15_000,
  })
})

// ── Mutation check: creates a throwaway account. Opt-in only. ──
// Run with: SMOKE_MUTATIONS=1 npm run test:e2e

test('tenant can register and land in the app', async ({ page }) => {
  test.skip(
    process.env.SMOKE_MUTATIONS !== '1',
    'mutation smoke — set SMOKE_MUTATIONS=1 to run'
  )

  const stamp = Date.now()
  await page.goto('/register')
  await page.getByText(/looking for a place to rent/i).click()
  await expect(page.getByText('Tenant Sign Up')).toBeVisible()

  // Fill by input order within the form (labels are not htmlFor-linked).
  const textInputs = page.locator(
    'form input[type="text"], form input:not([type])'
  )
  await textInputs.nth(0).fill('Smoke')
  await textInputs.nth(1).fill(`Test${stamp}`)
  await page.locator('input[type="email"]').fill(`smoke.${stamp}@example.com`)
  const passwords = page.locator(
    'input[type="password"], input[placeholder*="8 chars" i]'
  )
  await passwords.nth(0).fill('SmokeTest123')
  await passwords.nth(1).fill('SmokeTest123')

  await page.getByRole('button', { name: /sign up|create/i }).click()
  // Registration lands tenants on the browse experience.
  await page.waitForURL(/\/($|listings)/, { timeout: 20_000 })
  await expect(page.locator('#root')).not.toBeEmpty()
})
