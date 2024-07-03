const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { createJWT, createUserToken } = require('../util');

const register = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    throw new CustomError.BadRequestError('Please provide all values');
  }

  // Password confirmation check
  if (password !== confirmPassword) {
    throw new CustomError.BadRequestError('Passwords do not match');
  }

  // Existing email check
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new CustomError.BadRequestError('Email already exists');
  }

  // Minimum password length check (unchanged)
  if (password.length < 6) {
    throw new CustomError.BadRequestError('Password must be at least 6 characters long');
  }

  // User creation with email (username removed)
  const newUser = await User.create({ name, email, password });
  const tokenUser = createUserToken(newUser);
  const token = createJWT(tokenUser);

  res.status(StatusCodes.CREATED).json({ user: tokenUser, token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new CustomError.BadRequestError(
      'Please provide your email and password to login'
    );
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.UnauthenticatedError('Incorrect email/password');
  }

  // Check Password
  const checkPassword = await user.checkPassword(password);
  if (!checkPassword) {
    throw new CustomError.UnauthenticatedError('Incorrect email/password');
  }

  // If everything is fine
  const tokenUser = createUserToken(user);

  // create jwt
  const token = createJWT(tokenUser);

  res.status(StatusCodes.OK).json({ user: tokenUser, token: token });
};

const logout = async (req, res, next) => {
  res.status(StatusCodes.OK).json({ msg: 'Logged out succesfully' });
};


//  checkPermissions(req.user, user._id);

const getUser = async (req, res) => {
    const userID = req.params.uid;
    // console.log(userID);
    const user = await User.findOne({ _id: userID }).select('-password');

    // If user doesnt exist
    if(!user) {
        throw new CustomError.NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({ user : user.toObject({getters: true}) });
};

const getAllUsers = async (req, res) => {
    const users = await User.find({}).select('-password');
    res.status(StatusCodes.OK).json({ users });
};

const addPersonToGroup = async (req, res) => {
    const { email } = req.body;
    const userId = req.params.uid;

    // Find original user
    const user = await User.findOne({ _id: userId });
    if(!user) {
        throw new CustomError.NotFoundError('User not found');
    }

    const userToBeAdded = await User.findOne({ email });
    if(!userToBeAdded) {
        throw new CustomError.NotFoundError('User not found');
    }

    // Check if userToBeAdded is already in the user's groupPeople field
    if(user.groupPeople.includes(userToBeAdded._id)) {
        throw new CustomError.BadRequestError('User already in group');
    }

    // Check for, cannot add yourself
    if(user._id.toString() === userToBeAdded._id.toString()) {
        throw new CustomError.BadRequestError('Cannot add yourself');
    }

    // Add userToBeAdded in the user's groupPeople field in the database and update user

    user.groupPeople.push(userToBeAdded._id);
    await user.save();

    res.status(StatusCodes.OK).json({ message: 'User added to group successfully' });
};

const getEmailsForGroup = async (req, res) => {
    const userId = req.params.uid;
    const user = await User.findOne({ _id: userId });
    if(!user) {
        throw new CustomError.NotFoundError('User not found');
    }

    // get emails for each user in the user's groupPeople field
    const emails = await User.find({ _id: { $in: user.groupPeople } }).select('email');
    res.status(StatusCodes.OK).json({ emails });
};

const updateUser = async (req, res) => {
  const userId = req.params.uid; // User ID from request parameters

  const { updatedEmail, name, oldPassword, newPassword } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError.BadRequestError('User not found');
  }

  // Update Logic
  let isUpdated = false; // Flag to track if any update happened

  if (updatedEmail !== user.email){
    // Email Update
    const existingEmail = await User.findOne({ email: updatedEmail });
    if (existingEmail && existingEmail._id.toString() !== userId) {
      throw new CustomError.BadRequestError('Email already exists');
    }
    user.email = updatedEmail;
    isUpdated = true;
  }

  if (name) {
    // Name Update (cannot be empty)
    if (!name) {
      throw new CustomError.BadRequestError('Name cannot be empty');
    }
    user.name = name;
    isUpdated = true;
  }

  if (newPassword) {
    // Password Update
    if (!oldPassword) {
      throw new CustomError.BadRequestError('Please provide old password to update');
    }
    const isMatch = await user.checkPassword(oldPassword);
    if (!isMatch) {
      throw new CustomError.BadRequestError('Incorrect old password');
    }

    user.password = newPassword;
    isUpdated = true;
  }

  // Update user only if there were changes
  if (isUpdated) {
    await user.save();
    res.status(StatusCodes.OK).json({ message: 'User updated successfully' });
  } else {
    res.status(StatusCodes.OK).json({ message: 'No changes detected' });
  }
};

module.exports = {
    register,
    login,
    logout,
    getUser,
    getAllUsers,
    addPersonToGroup,
    getEmailsForGroup,
    updateUser
}