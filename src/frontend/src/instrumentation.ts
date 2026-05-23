import * as Sentry from '@sentry/nextjs';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only import Sentry, avoid importing app services to prevent circular dependencies
    // as per OBS-02 requirements.
    import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;