import { env } from '../config/environment.js';

const levels = {
  INFO: '\x1b[36m[INFO]\x1b[0m',
  WARN: '\x1b[33m[WARN]\x1b[0m',
  ERROR: '\x1b[31m[ERROR]\x1b[0m',
  DEBUG: '\x1b[35m[DEBUG]\x1b[0m',
  SUCCESS: '\x1b[32m[SUCCESS]\x1b[0m'
};

const timestamp = () => new Date().toISOString();

export const logger = {
  info: (...args) => console.log(`${levels.INFO} [${timestamp()}]`, ...args),
  warn: (...args) => console.warn(`${levels.WARN} [${timestamp()}]`, ...args),
  error: (...args) => console.error(`${levels.ERROR} [${timestamp()}]`, ...args),
  success: (...args) => console.log(`${levels.SUCCESS} [${timestamp()}]`, ...args),
  debug: (...args) => {
    if (env.isDevelopment) {
      console.debug(`${levels.DEBUG} [${timestamp()}]`, ...args);
    }
  }
};

export default logger;
