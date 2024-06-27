const express = require('express');

const {register, updateUserImageAndLocation, updateUserInterests, getUser} = require('../controllers/userController');
const fileUpload = require('../middleware/file-upload');

const {authenticateUser} = require('../middleware/authentication');

const router = express.Router();

// register user
router.route('/register').post(register);

// update user image and location
router.route('/:uid').patch(fileUpload.single('image'), authenticateUser, updateUserImageAndLocation)
                     .get(getUser);

// update interests
router.route('/interests/:uid').patch(authenticateUser, updateUserInterests);

module.exports = router;
