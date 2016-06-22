import test from 'tape';
import tapSpec from 'tap-spec';
import jwt from 'jsonwebtoken';
import requestPromise from 'request-promise';
import retryPromise from 'retry-promise';
import rethinkdb from 'rethinkdb';
import rethinkdbInit from 'rethinkdb-init';
rethinkdbInit(rethinkdb);

test.createStream()
  .pipe(tapSpec())
  .pipe(process.stdout);

const before = test;
const after = test;

const host = process.env.HOST || 'auth';
const port = 8080;
let userId;
let connection;
const refreshToken = '1234';
const config = {
  host: process.env.RETHINKDB_SERVICE_HOST || 'rethinkdb',
  port: 28015,
  db: 'auth',
};
const tableConfig = [
  'sessions',
  'users',
];
const secret = process.env.JWT_SECRET;

const connectDB = () => (
  rethinkdb.init(config, tableConfig)
    .then((conn) => {
      conn.use(config.db);
      connection = conn;
    })
);

const disconnectDB = () => {
  if (connection) {
    connection.close();
  }
};

const populateDB = () => (
  rethinkdb.table('users')
    .insert({ name: 'A person', roles: ['admin'] })
    .run(connection)
  .then((result) => {
    userId = result.generated_keys[0];
  })
  .then(() => (
    rethinkdb.table('sessions')
      .insert({
        userId,
        refreshToken,
      })
      .run(connection)
  ))
);

const resetDB = () => (
  rethinkdb.table('users')
    .delete()
    .run(connection)
    .then(() => (
      rethinkdb.table('sessions')
        .delete()
        .run(connection)
    ))
);

before('before', (t) => {
  const healthCheck = (attempt) => {
    if (attempt > 1) {
      t.comment('Health Check Failed Retrying...');
    }
    return requestPromise({
      method: 'GET',
      uri: `http://${host}:${port}/health`,
      json: true,
      resolveWithFullResponse: true,
    }).then((response) => {
      if (response.statusCode !== 200) {
        throw new Error('Health Check Failed');
      }
    });
  };
  return retryPromise({ max: 5, backoff: 10000 }, healthCheck)
    .then(() => connectDB())
    .then(() => {
      t.pass('Connect To SUT and Database');
      t.end();
    })
    .catch((error) => t.fail(error));
});

test('POST /create', (t) => {
  populateDB()
    .then(() => (
      requestPromise({
        method: 'POST',
        uri: `http://${host}:${port}/v1/create`,
        body: {
          userId,
        },
        json: true,
        resolveWithFullResponse: true,
      })
    ))
    .then((response) => {
      t.equal(response.statusCode, 200, 'statusCode: 200');
      t.deepEqual(
        Object.keys(response.body).sort(),
        ['accessToken', 'expireTime', 'refreshToken'],
        'response has expected keys'
      );
      return new Promise((resolve, reject) => {
        jwt.verify(response.body.accessToken, secret, (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            t.equal(decoded.userId, userId, 'token has expected payload');
            t.deepEqual(decoded.roles, ['admin'], 'token has expected roles in payload');
            resolve(response.body.refreshToken);
          }
        });
      });
    })
    .then((testRefreshToken) => (
      rethinkdb.table('sessions')
        .filter({
          userId,
          refreshToken: testRefreshToken,
        })
        .count()
        .run(connection)
        .then((value) => {
          t.equal(value, 1, 'refresh token stored in db');
        })
    ))
    .catch((error) => t.fail(error))
    .then(() => resetDB())
    .then(() => t.end());
});

test('POST /refresh', (t) => {
  populateDB()
    .then(() => (
      requestPromise({
        method: 'POST',
        uri: `http://${host}:${port}/v1/refresh`,
        body: {
          userId,
          refreshToken,
        },
        json: true,
        resolveWithFullResponse: true,
      })
    ))
    .then((response) => {
      t.equal(response.statusCode, 200, 'statusCode: 200');
      t.deepEqual(
        Object.keys(response.body).sort(),
        ['accessToken', 'expireTime'],
        'response has expected keys'
      );
      // TODO: after secrets have been resolved make sure the token can be verified
    })
    .catch((error) => t.fail(error))
    .then(() => resetDB())
    .then(() => t.end());
});

test('POST /reject', (t) => {
  populateDB()
    .then(() => (
      requestPromise({
        method: 'POST',
        uri: `http://${host}:${port}/v1/reject`,
        body: {
          userId,
          refreshToken,
        },
        json: true,
        resolveWithFullResponse: true,
      })
    ))
    .then((response) => {
      t.equal(response.statusCode, 200, 'statusCode: 200');
      t.deepEqual(response.body, {}, 'returns empty response');
    })
    .then(() => (
      rethinkdb.table('sessions')
        .filter({
          userId,
          refreshToken,
        })
        .count()
        .run(connection)
        .then((value) => {
          t.equal(value, 0, 'refreshToken deleted from database');
        })
    ))
    .catch((error) => t.fail(error))
    .then(() => resetDB())
    .then(() => t.end());
});


after('after', (t) => {
  disconnectDB();
  t.pass('Disconnected from DB');
  t.end();
});
