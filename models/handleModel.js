const mongoose = require("mongoose");

const rankChange = {
  date: Date,
  rank: String,
};

const handleSchema = new mongoose.Schema({
  handle: String,
  handleLower: String,
  rank: String,
  daily: [Date],
  rankChanges: [rankChange],
  rating: Number,
  maxRating: Number,
  streak: {
    type: Number,
    default: 0,
  },
  maxStreak: {
    type: Number,
    default: 0,
  },
});

//Stores the changes to user rank in rankChanges when the rank is updated
handleSchema.pre("save", function (next) {
  if (!this.isModified("rank")) return next();
  this.rankChanges.push({ date: new Date(), rank: this.rank });
  next();
});

handleSchema.pre("save", function (next) {
  this.handleLower = this.handle.toLowerCase();
  next();
});

const Handle = mongoose.model("handle", handleSchema);
module.exports = Handle;
