const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const User = require('../models/User');
const { createJWT, createUserToken, checkPermissions } = require('../util');

const register = async (req, res) => {
    const { name, username, email, password } = req.body;

    if(!name || !username || !email || !password) {
        throw new CustomError.BadRequestError('Please provide all values');
    }

    // If email exists
    const existingEmail = await User.findOne({ email });
    if(existingEmail) {
        throw new CustomError.BadRequestError('Email already exists');
    }

    // If username exists
    const existingUsername = await User.findOne({ username });
    if(existingUsername) {
        throw new CustomError.BadRequestError('Username has already been taken');
    }

    if(password.length < 6) {
        throw new CustomError.BadRequestError('Password must be at least 6 characters long');
    }

    const newUser = await User.create({ name, username, email, password });

    // Setup JWT
    const tokenUser = createUserToken(newUser);

    // Create JWT token
    const token = createJWT(tokenUser);

    res.status(StatusCodes.CREATED).json({ user: tokenUser, token });
}

const updateUserImageAndLocation = async (req, res) => {
    const { location } = req.body;

    if(!location) {
        throw new CustomError.BadRequestError('Please provide your location');
    }

    const userID = req.params.uid;

    const user = await User.findOne({ _id: userID });

    // If user doesnt exist
    if(!user) {
        throw new CustomError.NotFoundError('User not found');
    }

    checkPermissions(req.user, user._id);

    //  console.log(userID);

    user.image = req.file.path;
    user.location = location;

    await user.save();

    res.status(StatusCodes.OK).json({ msg: 'User updated successfully' });
}

const updateUserInterests = async (req, res) => {
    const {selectedOptions} = req.body;
    // console.log(selectedOptions);

    const userID = req.params.uid;

    const user = await User.findOne({ _id: userID });

    // If user doesnt exist
    if(!user) {
        throw new CustomError.NotFoundError('User not found');
    }

    checkPermissions(req.user, user._id);

    console.log(userID);

    user.interests = selectedOptions;

    await user.save();

    res.status(StatusCodes.OK).json({ msg: 'User updated successfully' });
}

const getUser = async (req, res) => {
    const userID = req.params.uid;
    // console.log(userID);
    const user = await User.findOne({ _id: userID });

    // If user doesnt exist
    if(!user) {
        throw new CustomError.NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({ user : user.toObject({getters: true}) });
}

module.exports = {
    register,
    updateUserImageAndLocation,
    updateUserInterests,
    getUser
}