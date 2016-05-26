import express from 'express';
import {
  INIT_ROUTES,
  CALC_MISSING_REQ_PARAMS,
} from './symbols';

export default class Router {
  constructor(options = {}) {
    this.tokenManager = options.tokenManager;
    this.router = new express.Router();
    this[INIT_ROUTES]();
  }

  [INIT_ROUTES]() {
    this.router.post('/create', (req, res) => {
      this[CALC_MISSING_REQ_PARAMS](req, ['userId'])
        .then(() => {
          const createdAt = Date.now();
          return this.tokenManager.generateToken({
            userId: req.body.userId,
            createdAt,
          });
        })
        .then((token) => res.status(200).send({ ...token }))
        .catch((error) => res.status(400).send({ error }));
    });
    this.router.post('/refresh', (req, res) => {
      this[CALC_MISSING_REQ_PARAMS](req, ['userId', 'refreshToken'])
        .then(() => {
          const createdAt = Date.now();
          return this.tokenManager.refreshToken({
            userId: req.body.userId,
            refreshToken: req.body.refreshToken,
            createdAt,
          });
        })
        .then((token) => res.status(200).send({ ...token }))
        .catch((error) => res.status(400).send({ error }));
    });
    this.router.post('/reject', (req, res) => {
      this[CALC_MISSING_REQ_PARAMS](req, ['userId', 'refreshToken'])
        .then(() =>
          this.tokenManager.deleteToken({
            userId: req.body.userId,
            refreshToken: req.body.refreshToken,
          })
        )
        .then(() => res.status(200).send({}))
        .catch((error) => res.status(400).send({ error }));
    });
  }

  [CALC_MISSING_REQ_PARAMS](req, params = []) {
    return new Promise((resolve, reject) => {
      const missingParams = params.filter((param) => {
        if (param in req.body) {
          return undefined;
        }
        return true;
      });
      if (missingParams.length) {
        reject(`Missing Param(s): ${missingParams.join(', ')}`);
      } else {
        resolve();
      }
    });
  }
}
