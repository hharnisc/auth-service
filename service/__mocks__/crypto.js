const crypto = jest.genMockFromModule('crypto');
crypto.refreshTokenValue = 'aRefreshToken';
crypto.toString = jest.fn().mockImplementation(() => crypto.refreshTokenValue);
crypto.randomBytes = jest.fn().mockImplementation(() => ({
  toString: crypto.toString,
}));
module.exports = crypto;
