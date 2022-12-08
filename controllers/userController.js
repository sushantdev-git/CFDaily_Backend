const fetch = require("node-fetch");

const Handle = require("../models/handleModel");
const User = require("../models/userModel");

const catchAsyc = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// Send the user information
exports.getUser = catchAsyc(async (req, res, next) => {
  const id = req.user._id;
  const user = await User.findById(id).populate("handle");
  res.status(200).json({
    sattus: "success",
    user: user,
  });
});

//Fetchs information from codeforces api and updates the database
exports.refresh = catchAsyc(async (req, res, next) => {
  const handle = await Handle.findById(req.user.handle);
  const response = await fetch(
    `https://codeforces.com/api/user.info?handles=${handle.handle}`
  );

  const responseJSON = await response.json();

  if (responseJSON.status === "FAILED")
    throw new AppError(400, responseJSON.comment);

  handle.rating = responseJSON.result[0].rating;
  handle.maxRating = responseJSON.result[0].maxRating;
  handle.rank = responseJSON.result[0].rank;

  await handle.save();

  const user = await User.findById(req.user._id).populate("handle");
  res.status(200).json({
    status: "success",
    user: user,
  });
});

exports.addHandle = catchAsyc(async (req, res, next) => {
  const user = req.user;
  const handle = req.body.handle;
  if (!handle) throw new AppError(404, "Please provide a codeforces handle");

  let newHandle = await Handle.findOne({ handleLower: handle.toLowerCase() });
 
  if (!newHandle) {
    const response = await fetch(
      `https://codeforces.com/api/user.info?handles=${handle}`
    );

    const responseJSON = await response.json();

    if (responseJSON.status === "FAILED")
      throw new AppError(400, responseJSON.comment);

    newHandle = await Handle.create({
      handle: responseJSON.result[0].handle,
      rating: responseJSON.result[0].rating,
      maxRating: responseJSON.result[0].maxRating,
      rank: responseJSON.result[0].rank,
    });
  }

  user.handle = newHandle;
  await user.save();
  res.status(200).json({ status: "success", data: user });
});
