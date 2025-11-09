const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[APP LOG]', ...args);
    }
  },
  warn: (...args: any[]) => {
    console.warn('[APP WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[APP ERROR]', ...args);
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[APP DEBUG]', ...args);
    }
  },
};

