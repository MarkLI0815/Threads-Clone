const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const generateUserToken = (user) => {
  return generateToken({
    userId: user.id,
    username: user.username,
    userRole: user.userRole
  });
};

module.exports = {
  generateToken,
  verifyToken,
  generateUserToken
};