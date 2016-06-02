jest.unmock('../src/DatabaseDriver');
jest.unmock('../src/symbols');
jest.mock('rethinkdb');
import DatabaseDriver from '../src/DatabaseDriver';
import { INSERT } from '../src/symbols';
import rethinkdb from 'rethinkdb';

describe('DatabaseDriver', () => {
  it('does exist', () => {
    expect(DatabaseDriver).not.toEqual({});
  });

  it('does initialize database', (done) => {
    const rethinkdbConfig = {
      config: {
        host: 'localhost',
        port: 28015,
        db: 'someDb',
      },
    };
    const databaseDriver = new DatabaseDriver(rethinkdbConfig);
    databaseDriver.init().then(() => {
      expect(databaseDriver.connection.use).toBeCalledWith(rethinkdbConfig.config.db);
      expect(rethinkdb.init).toBeCalledWith(rethinkdbConfig.config, undefined);
      done();
    });
  });

  it('does handle database connection errors', (done) => {
    const rethinkdbConfig = {
      config: {
        host: 'badhost',
        port: 28015,
      },
    };
    const databaseDriver = new DatabaseDriver(rethinkdbConfig);
    databaseDriver.init()
    .then(() => {
      throw new Error('Expecting connection to be invalid');
    })
    .catch((err) => {
      expect(err).toBe('bad host detected');
      done();
    });
  });

  it('does init db with tables and indexes', (done) => {
    const rethinkdbConfig = {
      config: {
        host: 'localhost',
        port: 28015,
        db: 'someDb',
      },
      tableConfig: [
        'a',
        'b',
      ],
    };
    const databaseDriver = new DatabaseDriver(rethinkdbConfig);
    databaseDriver.init().then(() => {
      expect(rethinkdb.init).toBeCalledWith(rethinkdbConfig.config, rethinkdbConfig.tableConfig);
      done();
    });
  });

  it('does have a private insert method', () => {
    const databaseDriver = new DatabaseDriver();
    expect(databaseDriver[INSERT]).toBeDefined();
  });

  it('does insert data into database', (done) => {
    const databaseDriver = new DatabaseDriver();
    const table = 'sessions';
    const data = { someData: 'DATA!' };
    const options = { table, data };
    databaseDriver[INSERT](options).then((result) => {
      expect(result).toBe('result');
      expect(rethinkdb.table).toBeCalledWith(table);
      expect(rethinkdb.insert).toBeCalledWith(data);
      expect(rethinkdb.run).toBeCalledWith(databaseDriver.connection);
      done();
    });
  });

  it('does have a function to store new tokens', () => {
    const databaseDriver = new DatabaseDriver();
    expect(databaseDriver.storeToken).toBeDefined();
  });

  it('does set default table to store and retrieve sessions', () => {
    const databaseDriver = new DatabaseDriver();
    expect(databaseDriver.sessionTable).toBe('sessions');
  });

  it('does allow session table name to be configured', () => {
    const sessionTable = 'otherSessionTable';
    const databaseDriver = new DatabaseDriver({ sessionTable });
    expect(databaseDriver.sessionTable).toBe(sessionTable);
  });

  it('does store a new token', (done) => {
    const userId = 1;
    const refreshToken = 'refreshToken';
    const createdAt = new Date();
    const databaseDriver = new DatabaseDriver();
    const data = { userId, refreshToken, createdAt };
    databaseDriver.storeToken({ userId, refreshToken, createdAt }).then((result) => {
      expect(result).toBe('result');
      expect(rethinkdb.table).toBeCalledWith('sessions');
      expect(rethinkdb.insert).toBeCalledWith(data);
      expect(rethinkdb.run).toBeCalledWith(databaseDriver.connection);
      done();
    });
  });

  it('does have a method to delete a token', () => {
    const databaseDriver = new DatabaseDriver();
    expect(databaseDriver.deleteToken).toBeDefined();
  });

  it('does delete a token', (done) => {
    const userId = 1;
    const refreshToken = 'refreshToken';
    const databaseDriver = new DatabaseDriver();
    databaseDriver.deleteToken({ userId, refreshToken }).then((result) => {
      expect(result).toBe('result');
      expect(rethinkdb.table).toBeCalledWith('sessions');
      expect(rethinkdb.filter).toBeCalledWith({ userId, refreshToken });
      expect(rethinkdb.delete).toBeCalled();
      expect(rethinkdb.run).toBeCalledWith(databaseDriver.connection);
      done();
    });
  });

  it('does set a default table for users', () => {
    const databaseDriver = new DatabaseDriver();
    expect(databaseDriver.userTable).toBe('users');
  });

  it('does allow user table name to be configured', () => {
    const userTable = 'otherUserTable';
    const databaseDriver = new DatabaseDriver({ userTable });
    expect(databaseDriver.userTable).toBe(userTable);
  });

  it('does have a method to check if users exist', () => {
    const databaseDriver = new DatabaseDriver();
    expect(databaseDriver.userExists).toBeDefined();
  });

  it('does find existing user', (done) => {
    const userId = 1;
    const databaseDriver = new DatabaseDriver();
    databaseDriver.userExists({ userId }).then((result) => {
      expect(result).toBe(true);
      expect(rethinkdb.table).toBeCalledWith('users');
      expect(rethinkdb.get).toBeCalledWith(userId);
      expect(rethinkdb.run).toBeCalledWith(databaseDriver.connection);
      done();
    });
  });

  it('does not find a user who doesn\'t exist', (done) => {
    const userId = 2;
    const databaseDriver = new DatabaseDriver();
    databaseDriver.userExists({ userId }).then((result) => {
      expect(result).toBe(false);
      expect(rethinkdb.table).toBeCalledWith('users');
      expect(rethinkdb.get).toBeCalledWith(userId);
      expect(rethinkdb.run).toBeCalledWith(databaseDriver.connection);
      done();
    });
  });

  it('does have a method to check if refresh token exists', () => {
    const databaseDriver = new DatabaseDriver();
    expect(databaseDriver.tokenExists).toBeDefined();
  });

  it('does find existing token', (done) => {
    const userId = 1;
    const refreshToken = 'refreshToken';
    const databaseDriver = new DatabaseDriver();
    databaseDriver.tokenExists({ userId, refreshToken }).then((result) => {
      expect(result).toBe(true);
      expect(rethinkdb.table).toBeCalledWith('sessions');
      expect(rethinkdb.filter).toBeCalledWith({ userId, refreshToken });
      expect(rethinkdb.count).toBeCalled();
      expect(rethinkdb.countRun).toBeCalledWith(databaseDriver.connection);
      done();
    });
  });

  it('does not find a token that doesn\'t exist', (done) => {
    const userId = 1;
    const refreshToken = 'badRefreshToken';
    const databaseDriver = new DatabaseDriver();
    databaseDriver.tokenExists({ userId, refreshToken }).then((result) => {
      expect(result).toBe(false);
      expect(rethinkdb.table).toBeCalledWith('sessions');
      expect(rethinkdb.filter).toBeCalledWith({ userId, refreshToken });
      expect(rethinkdb.count).toBeCalled();
      expect(rethinkdb.countRunNotFound)
        .toBeCalledWith(databaseDriver.connection);
      done();
    });
  });
});
