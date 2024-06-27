const CustomError = require('../errors');

const checkPermissions = (requestUser, resourceUserID) => {
  if (requestUser.userID === resourceUserID.toString()) {
    return;
  }
  throw new CustomError.UnauthorizedError(
    'You are unauthorized to access this route'
  );
};

module.exports = checkPermissions;
