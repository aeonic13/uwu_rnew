import { defineConfig } from '@playwright/test'

/**
 * Golden-path smoke tests (MVP_LAUNCH_PLAN P0-6).
 *
 * Runs against production by default so deploys can't silently regress the
 * funnel:  npm run test:e2e
 * Point elsewhere with SMOKE_BASE_URL (e.g. a local dev stack).
 * Mutation tests (real account registration) only run with SMOKE_MUTATIONS=1.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.SMOKE_BASE_URL || 'https://myrentra.com',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
