const createUserToken = (user) => {
  return {
    name: user.name,
    userID: user._id,
  };
};

module.exports = createUserToken;
