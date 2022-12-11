const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Handle = require("./handleModel");

const userSchema = new mongoose.Schema({
  name: String,
  handle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Handle,
  },
  email: {
    type: String,
    unique: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    select: false,
  },
  verificationOtp: String,
  verificationOtpExpires: Date,

  passwordChangedAt: Date,
  passwordResetOtp: String,
  passwordResetExpires: Date,

  refreshToken: String,
  accessToken: String,
  refreshTokenCreatedAt: Date,
});

//Encrypts the password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

//Updates the passwordChangedAt field when password is changed
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//Checks whether the entered password is correct or not
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

//Checks whether the password was changed after specified time stamp
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimeStamp;
  }
  return false;
};

const User = mongoose.model("user", userSchema);
module.exports = User;
