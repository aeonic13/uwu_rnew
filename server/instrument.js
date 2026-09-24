/**
 * Sentry bootstrap. Imported first in index.js so it initialises before any
 * route module loads. A no-op when SENTRY_DSN is unset (local dev, tests),
 * so nothing here can break startup.
 *
 * Captures: unhandled errors reaching the Express error handler (wired in
 * index.js via setupExpressErrorHandler), unhandled promise rejections and
 * uncaught exceptions. Performance tracing is sampled low to stay inside
 * the free tier.
 */
import * as Sentry from '@sentry/node'

const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.RAILWAY_GIT_COMMIT_SHA || undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.05),
    // Never ship request bodies or auth headers to Sentry.
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request) {
        delete event.request.data
        if (event.request.headers) {
          delete event.request.headers.authorization
          delete event.request.headers.cookie
        }
      }
      return event
    },
  })
  console.log('🛰️  Sentry enabled')
}

export const sentryEnabled = Boolean(dsn)
export default Sentry
