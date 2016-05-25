import winston from 'winston';
import winstonExpressMiddleWare from 'winston-express-middleware';
import 'winston-logstash';

winstonExpressMiddleWare.requestWhitelist.push('connection.remoteAddress');

// console logger with custom formatting to handle request visualization
const transports = [
  new winston.transports.Console({
    colorize: true,
    label: 'auth',
    formatter: (options) => {
      const hasMeta = options.meta && Object.keys(options.meta).length;
      const isAccessLog = hasMeta && options.meta.req && options.meta.res;
      const label = (options.label ? options.label : '');
      const message = (options.message ? options.message : '');
      const metaData = (hasMeta && !isAccessLog ? `\n\t ${JSON.stringify(options.meta)}` : '');
      return `${options.level.toUpperCase()} [${label}] ${message} ${metaData}`;
    },
  }),
];

// TODO: make this configurable via command line
if (process.env.LOGSTASH_SERVICE_HOST) {
  transports.push(
    new (winston.transports.Logstash)({
      port: process.env.LOGSTASH_SERVICE_PORT,
      label: 'auth',
      host: process.env.LOGSTASH_SERVICE_HOST,
      timeout_connect_retries: 10000, // retry after 10 seconds
      max_connect_retries: 10, // retry 10 times
    })
  );
}

// logging instance for HTTP access logs
export const accessLogger = winstonExpressMiddleWare.logger({
  transports,
  ignoreRoute: (req, res) => {
    // use the error logger for 500's, that adds the stack trace
    if (res.statusCode === 500) {
      return true;
    }
    return false;
  },
  statusLevels: true,
  expressFormat: true,
});

// logging instance for HTTP error logs
export const errorLogger = winstonExpressMiddleWare.errorLogger({
  transports,
});

// logging instance for general purpose logging
export const logger = new (winston.Logger)({
  transports,
});
