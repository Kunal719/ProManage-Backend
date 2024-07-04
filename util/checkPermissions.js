const CustomError = require('../errors');

const checkPermissions = (requestUser, resourceUserID) => {
  if (requestUser.userID === resourceUserID.toString()) {
    return;
  }
  throw new CustomError.UnauthorizedError(
    'You are unauthorized to do this operation'
  );
};

module.exports = checkPermissions;
