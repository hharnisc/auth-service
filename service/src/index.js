import fs from 'fs';
import express from 'express';
import bodyParser from 'body-parser';
import minimist from 'minimist';
import DatabaseDriver from './DatabaseDriver';
import Router from './Router';
import healthRouter from './healthRouter';
import TokenManager from './TokenManager';
import { accessLogger, errorLogger, logger } from './logging';

const argv = minimist(process.argv.slice(2), {
  default: {
    port: 9090,
    apiVersion: 'v1',
    dbHost: process.env.RETHINKDB_SERVICE_HOST || 'localhost',
    dbPort: process.env.RETHINKDB_SERVICE_PORT || 28015,
    // explodes if neither are set
    secret: process.env.JWT_SECRET || fs.readFileSync('/etc/secrets/jwt-secret'),
  },
});
const dbOptions = {
  config: {
    host: argv.dbHost,
    port: argv.dbPort,
    db: 'auth',
  },
  tableConfig: [
    'sessions',
    'users',
  ],
  sessionTable: 'sessions',
  userTable: 'users',
};
const dbDriver = new DatabaseDriver(dbOptions);
dbDriver.init()
  .then(() => {
    logger.info('Connected to database');
    const tokenOptions = {
      dbDriver,
      secret: argv.secret,
      tokenLifetime: 5 * 60 * 60,
    };
    const tokenManager = new TokenManager(tokenOptions);
    const appRouter = new Router({ tokenManager });
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(accessLogger);
    app.use(`/${argv.apiVersion}`, appRouter.router);
    app.use('/', healthRouter);
    app.use(errorLogger);
    app.listen(argv.port);
    logger.info(`Auth service started on port ${argv.port}`);
  })
  .catch((error) => {
    logger.error('Error while connecting to database', {
      dbOptions,
      error,
    });
  });
