import test from 'tape';
import tapSpec from 'tap-spec';
import requestPromise from 'request-promise';
import retryPromise from 'retry-promise';

test.createStream()
  .pipe(tapSpec())
  .pipe(process.stdout);

const before = test;
const after = test;
const host = process.env.HOST || 'auth';
const port = process.env.PORT || 8080;

before('before', (t) => {
  const healthCheck = (attempt) => {
    if (attempt > 1) {
      t.comment('health check failed retrying...');
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
  return retryPromise({ max: 5, backoff: 1000 }, healthCheck)
    .then(() => {
      t.pass('test setup');
      t.end();
    })
    .catch((error) => t.fail(error));
});

test('GET /v1/thetime', (t) => {
  requestPromise({
    method: 'GET',
    uri: `http://${host}:${port}/v1/thetime`,
    json: true,
    resolveWithFullResponse: true,
  })
    .then((response) => {
      t.equal(response.statusCode, 200, 'has statusCode 200');
      t.deepEqual(
        Object.keys(response.body).sort(),
        ['time'],
        'response has expected keys'
      );
      t.end();
    })
    .catch((error) => t.fail(error));
});

after('after', (t) => {
  t.pass('test cleanup');
  t.end();
});
