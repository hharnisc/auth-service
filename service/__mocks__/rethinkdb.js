jest.autoMockOff();
require.requireActual('bluebird');
const rethinkdb = jest.genMockFromModule('rethinkdb');
jest.autoMockOn();
const connection = {
  use: jest.fn(),
};
rethinkdb.init = jest.fn().mockImplementation((config) =>
  new Promise((resolve, reject) => {
    if (config.host === 'localhost') {
      resolve(connection);
    } else {
      reject('bad host detected');
    }
  })
);
rethinkdb.run = jest.fn().mockImplementation((conn, cb) => {
  cb(undefined, 'result');
});
rethinkdb.getRun = jest.fn().mockImplementation((conn, cb) => {
  cb(undefined, 'data');
});
rethinkdb.getRunNotFound = jest.fn().mockImplementation((conn, cb) => {
  cb(undefined, null);
});
rethinkdb.countRun = jest.fn().mockImplementation((conn, cb) => {
  cb(undefined, 1);
});
rethinkdb.countRunNotFound = jest.fn().mockImplementation((conn, cb) => {
  cb(undefined, 0);
});
rethinkdb.count = jest.fn().mockImplementation(() => ({ run: rethinkdb.countRun }));
rethinkdb.notFoundCount = jest.fn().mockImplementation(() => ({ run: rethinkdb.countRunNotFound }));
rethinkdb.delete = jest.fn().mockImplementation(() => ({ run: rethinkdb.run }));
rethinkdb.insert = jest.fn().mockImplementation(() => ({ run: rethinkdb.run }));
rethinkdb.filter = jest.fn().mockImplementation((options = {}) => ({
  count: options.refreshToken === 'refreshToken' ? rethinkdb.count : rethinkdb.notFoundCount,
  delete: rethinkdb.delete,
}));
rethinkdb.get = jest.fn().mockImplementation((id) => {
  if (id === 1) {
    return { run: rethinkdb.getRun };
  }
  return { run: rethinkdb.getRunNotFound };
});
rethinkdb.table = jest.fn().mockImplementation(() => ({
  filter: rethinkdb.filter,
  insert: rethinkdb.insert,
  get: rethinkdb.get,
}));
module.exports = rethinkdb;
