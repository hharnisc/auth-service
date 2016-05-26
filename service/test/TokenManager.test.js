jest.unmock('../src/TokenManager');
jest.unmock('../src/symbols');
jest.mock('jsonwebtoken');
jest.mock('crypto');
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  GENERATE_JWT,
  GENERATE_REFRESH_TOKEN,
} from '../src/symbols';
import TokenManager from '../src/TokenManager';

describe('TokenManager', () => {
  it('does exist', () => {
    expect(TokenManager).not.toEqual({});
  });

  it('does initialize token manager', () => {
    const dbDriver = 'some db driver';
    const tokenManager = new TokenManager({ dbDriver });
    expect(tokenManager.dbDriver).toBe(dbDriver);
  });

  it('does initialize token lifetime', () => {
    const tokenManager = new TokenManager();
    expect(tokenManager.tokenLifetime).toBe(18000);
  });

  it('does allow configuration of token lifetime', () => {
    const tokenLifetime = 19000;
    const tokenManager = new TokenManager({ tokenLifetime });
    expect(tokenManager.tokenLifetime).toBe(tokenLifetime);
  });

  it('does have a method to generate a jsonwebtoken', () => {
    const tokenManager = new TokenManager();
    expect(tokenManager[GENERATE_JWT]).toBeDefined();
  });

  it('does initialize a secret', () => {
    const secret = 'SECRET';
    const tokenManager = new TokenManager({ secret });
    expect(tokenManager.secret).toBe(secret);
  });

  it('does generate a jsonwebtoken', () => {
    const userId = 1;
    const secret = 'SECRET';
    const tokenManager = new TokenManager({ secret });
    expect(tokenManager[GENERATE_JWT]({ userId })).toBe('aSignedToken');
    expect(jwt.sign).toBeCalledWith({ userId }, secret, { expiresIn: 5 * 60 * 60 });
  });

  it('does have a method to generate a refreshToken', () => {
    const secret = 'SECRET';
    const tokenManager = new TokenManager({ secret });
    expect(tokenManager[GENERATE_REFRESH_TOKEN]).toBeDefined();
  });

  it('does generate a refreshToken', () => {
    const userId = 1;
    const secret = 'SECRET';
    const tokenManager = new TokenManager({ secret });
    expect(tokenManager[GENERATE_REFRESH_TOKEN]({ userId }))
      .toBe(`${userId}.${crypto.refreshTokenValue}`);
    expect(crypto.randomBytes).toBeCalledWith(40);
    expect(crypto.toString).toBeCalledWith('hex');
  });

  it('does have a method to generate a token', () => {
    const secret = 'SECRET';
    const tokenManager = new TokenManager({ secret });
    expect(tokenManager.generateToken).toBeDefined();
  });

  it('does generate a token', (done) => {
    const userId = 1;
    const accessToken = 'aSignedToken';
    const refreshToken = 'aRefreshToken';
    const createdAt = 1300;
    const expiresIn = 100;
    const dbDriver = {
      userExists: jest.fn().mockImplementation(() => new Promise((resolve) => resolve(true))),
      storeToken: jest.fn().mockImplementation(() => new Promise((resolve) => resolve())),
    };
    const secret = 'SECRET';
    const tokenManager = new TokenManager({ secret, dbDriver, tokenLifetime: expiresIn });
    tokenManager[GENERATE_JWT] = jest.fn().mockImplementation(() => accessToken);
    tokenManager[GENERATE_REFRESH_TOKEN] = jest.fn().mockImplementation(() => refreshToken);
    tokenManager.generateToken({
      userId,
      createdAt,
    })
      .then((result) => {
        expect(tokenManager[GENERATE_JWT]).toBeCalledWith({ userId });
        expect(tokenManager[GENERATE_REFRESH_TOKEN]).toBeCalledWith({ userId });
        expect(dbDriver.userExists).toBeCalledWith({ userId });
        expect(dbDriver.storeToken).toBeCalledWith({
          refreshToken,
          userId,
          createdAt,
        });
        expect(result).toEqual({
          accessToken,
          refreshToken,
          expireTime: createdAt + expiresIn,
        });
        done();
      });
  });

  it('does not create a token for non-existend user', (done) => {
    const userId = 2;
    const createdAt = 1300;
    const dbDriver = {
      userExists: jest.fn().mockImplementation(() => new Promise((resolve) => resolve(false))),
    };
    const secret = 'SECRET';
    const tokenManager = new TokenManager({ secret, dbDriver });
    tokenManager.generateToken({
      userId,
      createdAt,
    })
      .catch((err) => {
        expect(err).toBe(`UserId ${userId} does not exist`);
        done();
      });
  });

  it('does handle errors when storing tokens', (done) => {
    const userId = 1;
    const createdAt = 1300;
    const storeTokenError = 'something broke';
    const dbDriver = {
      userExists: jest.fn().mockImplementation(() => new Promise((resolve) => resolve(true))),
      storeToken: jest.fn().mockImplementation(() =>
        new Promise((resolve, reject) => reject(storeTokenError))),
    };
    const secret = 'SECRET';
    const tokenManager = new TokenManager({ secret, dbDriver });
    tokenManager.generateToken({
      userId,
      createdAt,
    })
      .catch((err) => {
        expect(err).toBe(storeTokenError);
        done();
      });
  });

  it('does handle errors when checking user existence', (done) => {
    const errorMessage = 'something broke again';
    const userId = 1;
    const createdAt = 1300;
    const dbDriver = {
      userExists: jest.fn().mockImplementation(() =>
        new Promise((resolve, reject) => reject(errorMessage))),
    };
    const secret = 'SECRET';
    const tokenManager = new TokenManager({ secret, dbDriver });
    tokenManager.generateToken({
      userId,
      createdAt,
    })
      .catch((err) => {
        expect(err).toBe(errorMessage);
        done();
      });
  });

  it('does have a method to delete a token', () => {
    const tokenManager = new TokenManager();
    expect(tokenManager.deleteToken).toBeDefined();
  });

  it('does delete a token', (done) => {
    const refreshToken = 'aRefreshToken';
    const userId = 1;
    const dbDriver = {
      tokenExists: jest.fn().mockImplementation(() => new Promise((resolve) => resolve(true))),
      deleteToken: jest.fn().mockImplementation(() => new Promise((resolve) => resolve())),
    };
    const secret = 'SECRET';
    const tokenManager = new TokenManager({ secret, dbDriver });
    tokenManager.deleteToken({ refreshToken, userId })
      .then(() => {
        expect(dbDriver.tokenExists).toBeCalledWith({ refreshToken, userId });
        expect(dbDriver.deleteToken).toBeCalledWith({ refreshToken, userId });
        done();
      });
  });

  it('does not delete token when it doesn\'t exist', (done) => {
    const refreshToken = 'aRefreshToken';
    const userId = 1;
    const dbDriver = {
      tokenExists: jest.fn().mockImplementation(() => new Promise((resolve) => resolve(false))),
    };
    const secret = 'SECRET';
    const tokenManager = new TokenManager({ secret, dbDriver });
    tokenManager.deleteToken({ refreshToken, userId })
      .catch((err) => {
        expect(err).toBe(`Token does not exist for token: ${refreshToken} and userId: ${userId}`);
        done();
      });
  });

  it('does handle errors when deleting a token', (done) => {
    const refreshToken = 'aRefreshToken';
    const errorMessage = 'some error message';
    const userId = 1;
    const dbDriver = {
      tokenExists: jest.fn().mockImplementation(() => new Promise((resolve) => resolve(true))),
      deleteToken: jest.fn().mockImplementation(() =>
        new Promise((resolve, reject) => reject(errorMessage))),
    };
    const secret = 'SECRET';
    const tokenManager = new TokenManager({ secret, dbDriver });
    tokenManager.deleteToken({ refreshToken, userId })
      .catch((err) => {
        expect(err).toBe(errorMessage);
        done();
      });
  });

  it('does handle errors when checking token existence', (done) => {
    const refreshToken = 'aRefreshToken';
    const errorMessage = 'some other error message';
    const userId = 1;
    const dbDriver = {
      tokenExists: jest.fn().mockImplementation(() =>
        new Promise((resolve, reject) => reject(errorMessage))),
    };
    const secret = 'SECRET';
    const tokenManager = new TokenManager({ secret, dbDriver });
    tokenManager.deleteToken({ refreshToken, userId })
      .catch((err) => {
        expect(err).toBe(errorMessage);
        done();
      });
  });

  it('does have a method to refresh a token', () => {
    const tokenManager = new TokenManager();
    expect(tokenManager.refreshToken).toBeDefined();
  });

  it('does refresh a token', (done) => {
    const userId = 1;
    const accessToken = 'aSignedToken';
    const refreshToken = 'aRefreshToken';
    const createdAt = 1300;
    const expiresIn = 100;
    const dbDriver = {
      tokenExists: jest.fn().mockImplementation(() => new Promise((resolve) => resolve(true))),
    };
    const secret = 'SECRET';
    const tokenManager = new TokenManager({ secret, dbDriver, tokenLifetime: expiresIn });
    tokenManager[GENERATE_JWT] = jest.fn().mockImplementation(() => accessToken);
    tokenManager.refreshToken({
      userId,
      refreshToken,
      createdAt,
    })
      .then((result) => {
        expect(dbDriver.tokenExists).toBeCalledWith({ userId, refreshToken });
        expect(tokenManager[GENERATE_JWT]).toBeCalledWith({ userId });
        expect(result).toEqual({
          accessToken,
          expireTime: createdAt + expiresIn,
        });
        done();
      });
  });
});
