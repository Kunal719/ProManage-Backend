const express = require('express');

const {register, login, logout, getUser, getAllUsers, addPersonToGroup, getEmailsForGroup, updateUser} = require('../controllers/userController');
const {authenticateUser} = require('../middleware/authentication');

const router = express.Router();

// register user
router.route('/register').post(register);

// login user
router.route('/login').post(login);

// logout user
router.route('/logout').get(logout);

// update user
router.route('/updateUser/:uid').patch(authenticateUser, updateUser);

// get user
router.route('/:uid').get(getUser);

// get all users
router.route('/').get(getAllUsers);

// add person to group
router.route('/:uid/addPersonToGroup').patch(authenticateUser, addPersonToGroup);

// get emails for group people
router.route('/:uid/getEmailsForGroup').get(authenticateUser, getEmailsForGroup);

module.exports = router;
