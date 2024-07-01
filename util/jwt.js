const jwt = require('jsonwebtoken');

const createJWT = (payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });

  return token;
};

const isVerifiedToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = { createJWT, isVerifiedToken };
