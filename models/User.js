const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: [true, "Please provide your name"]},
  username: { type: String, required: [true, "This username is already taken"], unique: true },
  email: { type: String, required: true, unique: true, validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email address',
    }, },
  password: { type: String, required: [true, "Please provide a password with min 6 characters"], minlength: 6 },
  interests: { type: [String], default: [] },
});

//Hash password
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);
