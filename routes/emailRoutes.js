const express = require('express');

const router = express.Router();

const {sendConfirmationEmail} = require('../controllers/emailController');

router.route('/verify-email').post(sendConfirmationEmail);

module.exports = router;