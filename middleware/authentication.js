const CustomError = require('../errors');
const { isVerifiedToken } = require('../util');

const authenticateUser = async (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  const token = req.headers.authorization.split(' ')[1]; // Bearer Token
  if (!token) {
    throw new CustomError.UnauthenticatedError(
      'Authentication Invalid, no token found'
    );
  }

  try {
    const { name, userID } = isVerifiedToken(token); // returns payload like createUserToken.js
    req.user = { name, userID };
  } catch (error) {
    throw new CustomError.UnauthenticatedError('Authentication Invalid');
  }

  next();
};

module.exports = { authenticateUser };
