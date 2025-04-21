import logsConfig from '@/config/logs';
import chalk from 'chalk';
import { existsSync, mkdirSync } from 'fs';
import moment from 'moment-timezone';
import { join } from 'path';
import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';

const { dir } = logsConfig;

const isTestEnv = process.env.NODE_ENV === 'test';

// logs dir
const logDir: string = join(__dirname, dir);

if (!isTestEnv) {
  if (!existsSync(logDir)) {
    mkdirSync(logDir);
  }
}

// Define log format
const logFormat = winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`);

// Custom filter for log levels
const filterOnly = level => {
  return winston.format(info => {
    return info.level === level ? info : false;
  })();
};

const transports = [];

if (!isTestEnv) {
  // Add file transports only if not in test environment
  transports.push(
    // Debug log setting
    new winstonDaily({
      level: 'debug',
      datePattern: 'YYYY-MM-DD',
      dirname: `${logDir}/debug`, // dir log file -> /logs/debug/*.log
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      json: false,
      zippedArchive: true,
    }),
    // Warn log setting
    new winstonDaily({
      level: 'warn',
      datePattern: 'YYYY-MM-DD',
      dirname: `${logDir}/warn`, // dir log file -> /logs/warn/*.log
      filename: `%DATE%.log`,
      maxFiles: 90, // 90 Days saved
      json: false,
      zippedArchive: true,
      format: winston.format.combine(filterOnly('warn')),
    }),
    // Error log setting
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: `${logDir}/error`, // dir log file -> /logs/error/*.log
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      handleExceptions: true,
      json: false,
      zippedArchive: true,
      format: winston.format.combine(filterOnly('error')),
    }),
  );

  // Add console transport only if not in test environment
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format(info => {
          info[Symbol.for('message')] = `${chalk[info.level === 'sql' ? 'blueBright' : 'yellow']('-'.repeat(process.stdout.columns))} [${chalk[
            info.level === 'sql' ? 'whiteBright' : 'red'
          ](info.level)}] ${chalk[info.level === 'sql' ? 'cyanBright' : 'blueBright'](info.message)}`;

          return info;
        })(),
      ),
    }),
  );
}

// Create the logger with the transports
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => moment().tz('Europe/Paris').format('YYYY-MM-DD HH:mm:ss'),
    }),
    logFormat,
  ),
  transports,
  silent: isTestEnv, // Silence all logs during tests
});

const stream = {
  write: (message: string) => {
    if (!isTestEnv && !/POST \/api\/stripe_webhook/.test(message)) {
      logger.info(message.trim());
    }
  },
};

export { logger, stream };
