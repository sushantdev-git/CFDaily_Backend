const mongoose = require("mongoose");

const problem = {
  name: String,
  rating: Number,
  link: String,
};

const dailyProblemSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  newbie: problem,
  pupil: problem,
  specialist: problem,
  expert: problem,
  candidateMaster: problem,
  master: problem,
  internationalMaster: problem,
  grandmaster: problem,
  internationalGrandmaster: problem,
  legendaryGrandmaster: problem,
});

const DailyProblem = mongoose.model("dailyProblems", dailyProblemSchema);
module.exports = DailyProblem;
