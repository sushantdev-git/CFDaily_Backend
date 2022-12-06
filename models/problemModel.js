const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
  name: String,
  rating: Number,
  link: String,
});

const Problems = mongoose.model("Problems", problemSchema);
module.exports = Problems;
