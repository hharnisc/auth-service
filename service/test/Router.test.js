jest.unmock('../src/Router');
jest.unmock('../src/symbols');
jest.unmock('supertest');
jest.unmock('express');
jest.unmock('body-parser');
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import {
  INIT_ROUTES,
  CALC_MISSING_REQ_PARAMS,
} from '../src/symbols';
import Router from '../src/Router';

describe('Router', () => {
  it('does exist', () => {
    expect(Router).not.toEqual({});
  });

  it('does initialize a tokenManager', () => {
    const tokenManager = 'manager';
    const router = new Router({ tokenManager });
    expect(router.tokenManager).toBe(tokenManager);
  });

  it('does have a method to initialize routes', () => {
    const router = new Router();
    expect(router[INIT_ROUTES]).toBeDefined();
  });

  it('does handle /create route', (done) => {
    const userId = 1;
    const refreshToken = 'aRefreshToken';
    const accessToken = 'aSignedToken';
    const createdAt = 1300;
    Date.now = jest.fn().mockReturnValue(createdAt);
    const tokenManager = {
      generateToken: jest.fn().mockImplementation(() => new Promise((resolve) => resolve({
        refreshToken,
        accessToken,
        expireTime: createdAt,
      }))),
    };
    const router = new Router({ tokenManager });
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(router.router);
    request(app)
      .post('/create')
      .send({ userId })
      .expect((res) => {
        expect(tokenManager.generateToken).toBeCalledWith({
          userId,
          createdAt,
        });
        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
          refreshToken,
          accessToken,
          expireTime: createdAt,
        });
      })
      .end(done);
  });

  it('does handle /create errors', (done) => {
    const userId = 1;
    const error = 'some error';
    const tokenManager = {
      generateToken: jest.fn().mockImplementation(() =>
        new Promise((resolve, reject) => reject(error))),
    };
    const createdAt = 1300;
    Date.now = jest.fn().mockReturnValue(createdAt);
    const router = new Router({ tokenManager });
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(router.router);
    request(app)
      .post('/create')
      .send({ userId })
      .expect((res) => {
        expect(tokenManager.generateToken).toBeCalledWith({
          userId,
          createdAt,
        });
        expect(res.status).toEqual(400);
        expect(res.body).toEqual({ error });
      })
      .end(done);
  });

  it('does handle /refresh route', (done) => {
    const userId = 1;
    const refreshToken = 'aRefreshToken';
    const accessToken = 'aSignedToken';
    const createdAt = 1300;
    Date.now = jest.fn().mockReturnValue(createdAt);
    const tokenManager = {
      refreshToken: jest.fn().mockImplementation(() => new Promise((resolve) => resolve({
        accessToken,
        expireTime: createdAt,
      }))),
    };
    const router = new Router({ tokenManager });
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(router.router);
    request(app)
      .post('/refresh')
      .send({ userId, refreshToken })
      .expect((res) => {
        expect(tokenManager.refreshToken).toBeCalledWith({
          userId,
          refreshToken,
          createdAt,
        });
        expect(res.status).toEqual(200);
        expect(res.body).toEqual({
          accessToken,
          expireTime: createdAt,
        });
      })
      .end(done);
  });

  it('does handle /refresh errors ', (done) => {
    const userId = 1;
    const refreshToken = 'aRefreshToken';
    const error = 'some /refresh error';
    const createdAt = 1300;
    Date.now = jest.fn().mockReturnValue(createdAt);
    const tokenManager = {
      refreshToken: jest.fn().mockImplementation(() =>
        new Promise((resolve, reject) => reject(error))),
    };
    const router = new Router({ tokenManager });
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(router.router);
    request(app)
      .post('/refresh')
      .send({ userId, refreshToken })
      .expect((res) => {
        expect(tokenManager.refreshToken).toBeCalledWith({
          userId,
          refreshToken,
          createdAt,
        });
        expect(res.status).toEqual(400);
        expect(res.body).toEqual({ error });
      })
      .end(done);
  });

  it('does handle /reject route', (done) => {
    const userId = 1;
    const refreshToken = 'aRefreshToken';
    const tokenManager = {
      deleteToken: jest.fn().mockImplementation(() => new Promise((resolve) => resolve({
        userId,
        refreshToken,
      }))),
    };
    const router = new Router({ tokenManager });
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(router.router);
    request(app)
      .post('/reject')
      .send({ userId, refreshToken })
      .expect((res) => {
        expect(tokenManager.deleteToken).toBeCalledWith({
          userId,
          refreshToken,
        });
        expect(res.status).toEqual(200);
        expect(res.body).toEqual({ });
      })
      .end(done);
  });

  it('does handle /reject errors', (done) => {
    const userId = 1;
    const refreshToken = 'aRefreshToken';
    const error = 'some /reject error';
    const tokenManager = {
      deleteToken: jest.fn().mockImplementation(() =>
        new Promise((resolve, reject) => reject(error))),
    };
    const router = new Router({ tokenManager });
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(router.router);
    request(app)
      .post('/reject')
      .send({ userId, refreshToken })
      .expect((res) => {
        expect(tokenManager.deleteToken).toBeCalledWith({
          userId,
          refreshToken,
        });
        expect(res.status).toEqual(400);
        expect(res.body).toEqual({ error });
      })
      .end(done);
  });

  it('does have a method to calculate request params', () => {
    const router = new Router();
    expect(router[CALC_MISSING_REQ_PARAMS]).toBeDefined();
  });

  it('does calculate missing request params', (done) => {
    const params = ['userId'];
    const error = `Missing Param(s): ${params.join(',')}`;
    const router = new Router();
    const req = {
      body: {},
    };
    router[CALC_MISSING_REQ_PARAMS](req, params)
      .catch((actualError) => {
        expect(actualError).toEqual(error);
        done();
      });
  });

  it('does calculate some missing request params', (done) => {
    const userId = 1;
    const params = ['userId', 'another thing'];
    const error = `Missing Param(s): ${params.slice(1, 2).join(',')}`;
    const router = new Router();
    const req = {
      body: {
        userId,
      },
    };
    router[CALC_MISSING_REQ_PARAMS](req, params)
      .catch((actualError) => {
        expect(actualError).toEqual(error);
        done();
      });
  });

  it('does calculate no missing request params', (done) => {
    const userId = 1;
    const password = 'password';
    const params = ['userId', 'password'];
    const router = new Router();
    const req = {
      body: {
        userId,
        password,
      },
    };
    router[CALC_MISSING_REQ_PARAMS](req, params)
      .then(() => done());
  });

  it('does handle missing params on /create route', (done) => {
    const error = 'Missing Param(s): userId';
    const router = new Router();
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(router.router);
    request(app)
      .post('/create')
      .expect((res) => {
        expect(res.status).toEqual(400);
        expect(res.body).toEqual({ error });
      })
      .end(done);
  });

  it('does handle missing params on /refresh route', (done) => {
    const error = 'Missing Param(s): userId, refreshToken';
    const router = new Router();
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(router.router);
    request(app)
      .post('/refresh')
      .expect((res) => {
        expect(res.status).toEqual(400);
        expect(res.body).toEqual({ error });
      })
      .end(done);
  });

  it('does handle missing params on /reject route', (done) => {
    const error = 'Missing Param(s): userId, refreshToken';
    const router = new Router();
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(router.router);
    request(app)
      .post('/reject')
      .expect((res) => {
        expect(res.status).toEqual(400);
        expect(res.body).toEqual({ error });
      })
      .end(done);
  });
});
