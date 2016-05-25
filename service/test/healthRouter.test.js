jest.unmock('../src/healthRouter');
jest.unmock('supertest');
jest.unmock('express');
jest.unmock('body-parser');
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import healthRouter from '../src/healthRouter';

describe('healthRouter', () => {
  it('does exist', () => {
    expect(healthRouter).not.toEqual({});
  });

  it('does handle /health route', (done) => {
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(healthRouter);
    request(app)
      .get('/health')
      .expect((res) => {
        expect(res.status).toEqual(200);
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});
