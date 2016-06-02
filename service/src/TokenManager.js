import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  GENERATE_JWT,
  GENERATE_REFRESH_TOKEN,
} from './symbols';

export default class TokenManager {
  constructor(options = {}) {
    this.dbDriver = options.dbDriver;
    this.tokenLifetime = options.tokenLifetime || 5 * 60 * 60;
    this.secret = options.secret;
  }

  [GENERATE_JWT](options = {}) {
    const userId = options.userId;
    const roles = options.roles || [];
    return jwt.sign({ userId, roles }, this.secret, { expiresIn: this.tokenLifetime });
  }

  [GENERATE_REFRESH_TOKEN](options = {}) {
    const userId = options.userId;
    return `${userId}.${crypto.randomBytes(40).toString('hex')}`;
  }

  generateToken(options = {}) {
    const userId = options.userId;
    const createdAt = options.createdAt;
    return this.dbDriver.getUser({ userId })
      .then((user) =>
        new Promise((resolve, reject) => {
          if (user === null) {
            reject(`UserId ${userId} does not exist`);
          } else {
            const accessToken = this[GENERATE_JWT]({ userId, roles: user.roles });
            const refreshToken = this[GENERATE_REFRESH_TOKEN]({ userId });
            this.dbDriver.storeToken({
              userId,
              refreshToken,
              createdAt,
            })
              .then(() => {
                resolve({
                  accessToken,
                  refreshToken,
                  expireTime: createdAt + this.tokenLifetime,
                });
              })
              .catch((err) => reject(err));
          }
        })
      );
  }

  deleteToken(options = {}) {
    const userId = options.userId;
    const refreshToken = options.refreshToken;
    return this.dbDriver.tokenExists({ userId, refreshToken })
      .then((exists) =>
        new Promise((resolve, reject) => {
          if (!exists) {
            reject(`Token does not exist for token: ${refreshToken} and userId: ${userId}`);
          } else {
            this.dbDriver.deleteToken({ userId, refreshToken })
              .then(() => resolve())
              .catch((err) => reject(err));
          }
        })
    );
  }

  refreshToken(options = {}) {
    const userId = options.userId;
    const refreshToken = options.refreshToken;
    const createdAt = options.createdAt;
    return new Promise((resolve, reject) => {
      this.dbDriver.tokenExists({ userId, refreshToken })
        .then((exists) => {
          if (!exists) {
            reject(`Token does not exist for token: ${refreshToken} and userId: ${userId}`);
          } else {
            this.dbDriver.getUser({ userId })
              .then((user) => {
                if (user === null) {
                  reject(`UserId ${userId} does not exist`);
                } else {
                  resolve({
                    accessToken: this[GENERATE_JWT]({ userId, roles: user.roles }),
                    expireTime: createdAt + this.tokenLifetime,
                  });
                }
              });
          }
        });
    });
  }
}
