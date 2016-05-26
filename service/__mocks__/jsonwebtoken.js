jest.autoMockOff();
const jsonwebtoken = jest.genMockFromModule('jsonwebtoken');
jest.autoMockOn();
jsonwebtoken.sign = jest.fn().mockImplementation(() => 'aSignedToken');
module.exports = jsonwebtoken;
