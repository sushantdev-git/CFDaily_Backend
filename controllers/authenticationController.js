const jwt = require("jsonwebtoken");
const randtoken = require("rand-token");
const fetch = require("node-fetch");
const otpGen = require("otp-generator");

const User = require("../models/userModel");
const Handle = require("../models/handleModel");

const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/email");

//creates a jwt and refresh token and sends it the client
const createAndSendToken = async (user, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const refreshToken = randtoken.uid(256);

  user.refreshToken = refreshToken;
  user.refreshTokenCreatedAt = Date.now();
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    token,
    refreshToken,
  });
};

// Sign up the user
exports.signup = catchAsync(async (req, res, next) => {
  const { handle, email, password, passwordConfirm, name } = req.body;

  if (!handle || !email || !password || !passwordConfirm || !name)
    throw new AppError(400, "Please send all the required details");

  if (password != passwordConfirm)
    throw new AppError(400, "Confirm password didn't match");

  const response = await fetch(
    `https://codeforces.com/api/user.info?handles=${handle}`
  );
  const responseJSON = await response.json();

  if (responseJSON.status === "FAILED")
    throw new AppError(400, "Codeforces handle not found");

  let newUser = await User.findOne({ email });
  if (newUser) throw new AppError(400, "Email already exists.");

  let newHandle = await Handle.findOne({
    handleLower: responseJSON.result[0].handle.toLowerCase(),
  });

  if (!newHandle) {
    newHandle = await Handle.create({
      handle: responseJSON.result[0].handle,
      rank: responseJSON.result[0].rank,
      rating: responseJSON.result[0].rating,
      maxRating: responseJSON.result[0].maxRating,
    });
  }

  newUser = await User.create({
    name: name,
    handle: newHandle,
    email: email,
    password: password,
  });

  req.user = newUser;
  next();
});

//Log in the user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    throw new AppError(404, "Please provide email and password");

  const user = await User.findOne({ email: email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password)))
    throw new AppError(401, "Incorrect email or password");

  if (!user.verified) {
    throw new AppError(400, "User not verified");
  }

  createAndSendToken(user, res);
});

// Send otp for email verification
exports.sendOTP = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  const newOTP = otpGen.generate(4, {
    upperCaseAlphabets: false,
    specialChars: false,
    digits: true,
    lowerCaseAlphabets: false,
  });

  await sendEmail({
    email: user.email,
    subject: "Email verification OTP",
    message: `Your OTP is ${newOTP}. If you did not request for otp, then please ignore the mail`,
  });

  await User.findByIdAndUpdate(user._id, {
    verificationOtp: newOTP,
    verificationOtpExpires: Date.now() + 1000 * 60 * 10,
  });

  res.status(200).json({ message: "OTP send successfully!" });
});

//Verify otp
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    throw new AppError(400, "Please send all the required details");

  const user = await User.findOne({ email: email });
  if (!user) throw new AppError("Incorrect email");

  if (user.verificationOtp != otp) throw new AppError(400, "Invalid OTP");
  if (Date.now() > user.verificationOtpExpires)
    throw new AppError(400, "Your OTP has expired");

  await User.findByIdAndUpdate(user._id, {
    verificationOtp: null,
    verificationOtpExpires: null,
    verified: true,
  });
  createAndSendToken(user, res);
});

exports.verifyToken = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  )
    token = req.headers.authorization.split(" ")[1];

  if (!token)
    throw new AppError(
      401,
      "Your are not logged in! Please log in to get access"
    );

  const decoded = await jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);
  if (!user)
    throw new AppError(401, "The user beloging to this token no longer exists");

  if (user.changedPasswordAfter(decoded.iat))
    throw new AppError(
      401,
      "User recently changed password! please log in again"
    );

  req.user = user;
  next();
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  if (!email) throw new AppError(400, "Please send all the required details");

  const refreshToken = req.body.refreshToken;
  if (!refreshToken)
    throw new AppError(
      401,
      "You are not logged in! Please log in to get access"
    );

  const user = await User.findOne({ email });

  if (!user)
    throw new AppError(401, "The user belogin to this email does not exist");

  if (
    user.refreshToken != refreshToken ||
    Date.now() > user.refreshTokenExpires + 1000 * 60 * 60 * 24 * 30 ||
    user.changedPasswordAfter(user.refreshTokenCreatedAt)
  )
    throw new AppError(404, "The refresh token is invalid");

  createAndSendToken(user, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  if (!email) throw new AppError(400, "Please send all the required details");

  const user = await User.findOne({ email });
  if (!user)
    throw new AppError(404, "There is no user with this email adderss");

  const newOTP = otpGen.generate(4, {
    upperCaseAlphabets: false,
    specialChars: false,
    digits: true,
    lowerCaseAlphabets: false,
  });

  user.passwordResetOtp = newOTP;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  await user.save();
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset otp (valid for 10 min)",
      message: `Your OTP is ${newOTP}. If you did not request for otp, then please ignore this email`,
    });

    res
      .status(200)
      .json({ status: "success", message: "OTP sent successfully" });
  } catch (err) {
    user.passwordResetOtp = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    throw new AppError(
      500,
      "There was an error sending the email. Try again later!"
    );
  }
});

exports.verifyOtp = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    throw new AppError(400, "Please send all the required details");

  const user = await User.findOne({ email });
  if (!user)
    throw new AppError(404, "There is no user with this email adderss");

  if (user.passwordResetOtp != otp || Date.now() > user.passwordResetExpires)
    throw new AppError(400, "OTP is invalid or has expired");

  user.passwordResetOtp = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createAndSendToken(user, res);
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const user = req.user;

  const { password, passwordConfirm } = req.body;
  if (!password || !passwordConfirm)
    throw new AppError(400, "Please send all the required details");

  if (password != passwordConfirm)
    throw new AppError(400, "Confirm password didn't match");

  user.password = password;
  user.refreshToken = undefined;
  user.refreshTokenCreatedAt = undefined;
  await user.save();

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});
