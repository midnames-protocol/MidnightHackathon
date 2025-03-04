import pino, { type Logger } from 'pino';

/**
 * Creates a Pino logger configured for use in the browser.
 *
 * @returns A configured `pino` logger instance.
 */
const createBrowserLogger = (): Logger => {
  const isDev = process.env.NODE_ENV !== 'production';

  return pino({
    browser: {
      asObject: true,
    },
    level: isDev ? 'trace' : 'info',
  });
};

/**
 * A singleton logger instance for the application.
 */
export const logger = createBrowserLogger();
