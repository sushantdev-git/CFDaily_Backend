const fetch = require("node-fetch");

const Handle = require("../models/handleModel");
const DailyProblem = require("../models/dailyProblemModel");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const {calculateStreak, checkIfSolved, getSubmittedDailyInRange} = require("../utils/AlgoFunctions");

const compare = (question, submission) => {
  if (question > submission) return 1;
  else if (submission - question <= 24 * 60 * 60 * 1000) return 0;
  else return -1;
};

const lowerBound = (submissions, question) => {
  let begin = 0,
    end = submissions.length - 1;
  let ans = -1;
  while (begin <= end) {
    let mid = begin + Math.floor((end - begin) / 2);
    let comp = compare(
      question,
      new Date(submissions[mid].creationTimeSeconds * 1000)
    );

    if (comp == 0) {
      ans = mid;
      begin = mid + 1;
    } else if (comp == 1) end = mid - 1;
    else begin = mid + 1;
  }
  return ans;
};

const upperBound = (submissions, question) => {
  let begin = 0,
    end = submissions.length - 1;
  let ans = -1;
  while (begin <= end) {
    let mid = begin + Math.floor((end - begin) / 2);
    let comp = compare(
      question,
      new Date(submissions[mid].creationTimeSeconds * 1000)
    );

    if (comp == 0) {
      ans = mid;
      end = mid - 1;
    } else if (comp == 1) end = mid - 1;
    else begin = mid + 1;
  }
  return ans;
};

const isSubmitted = (submissions, date, question) => {
  const lb = lowerBound(submissions, date);
  const ub = upperBound(submissions, date);

  for (i = ub; i <= lb; i++) {
    if (
      submissions[i].problem.name === question &&
      submissions[i].verdict === "OK"
    ) {
      return submissions[i];
    }
  }
  return false;
};

const getRank = (rankChanges, date) => {
  let begin = 0,
    end = rankChanges.length - 1;
  let res = -1;
  while (begin <= end) {
    let mid = begin + (end - begin) / 2;
    if (rankChanges[mid].date <= date) {
      res = mid;
      begin = mid + 1;
    } else end = mid - 1;
  }
  return rankChanges[res == -1 ? 0 : res].rank;
};

const getProblem = (dailyProblemSet, rank) => {
  if (rank === "newbie") return dailyProblemSet.newbie;
  else if (rank === "pupil") return dailyProblemSet.pupil;
  else if (rank === "specialist") return dailyProblemSet.specialist;
  else if (rank === "expert") return dailyProblemSet.expert;
  else if (rank === "candidate master") return dailyProblemSet.candidateMaster;
  else if (rank === "master") return dailyProblemSet.master;
  else if (rank === "international master")
    return dailyProblemSet.internationalMaster;
  else if (rank === "grandmaster") return dailyProblemSet.grandmaster;
  else if (rank === "international grandmaster")
    return dailyProblemSet.internationalGrandmaster;
  else if (rank === "legendary grandmaster")
    return dailyProblemSet.legendaryGrandmaster;
};

exports.validate = catchAsync(async (req, res, next) => {
  let { date } = req.body;
  if (!date) throw new AppError(400, "Please provide all the required details");

  date = new Date(date);
  date = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const user = req.user;
  const handle = await Handle.findById(user.handle);

  const response = await fetch(
    `https://codeforces.com/api/user.status?handle=${handle.handle}`
  );
  const resposneJSON = await response.json();
  const submissions = resposneJSON.result;

  const start = new Date(date.getTime());
  const end = new Date(date.getTime() + 1000 * 60 * 60 * 24 - 1);

  const dailyProblems = await DailyProblem.findOne({
    $and: [{ date: { $gte: start } }, { date: { $lte: end } }],
  });

  const rank = getRank(handle.rankChanges, date);
  const problem = getProblem(dailyProblems, rank);

  const submission = isSubmitted(submissions, date, problem.name);

  if (submission) {
    handle.daily.push(date);

    const [streak, maxStreak] = calculateStreak(handle.daily);
    handle.streak = streak;
    handle.maxStreak = maxStreak;
    await handle.save();
    
    res.status(200).json({
      status: "success",
      submission: submission,
    });

  } else res.status(200).json({ status: "fail", comment: "Not submitted" });
});


exports.monthlyQuestions = catchAsync(async (req, res, next) => {
  let date = req.body.date;
  if (!date) throw new AppError(400, "Please send all the required details.");
  date = new Date(date);

  const start = new Date(date.getFullYear(), date.getMonth(), 0);
  const end = new Date(start.getTime() + 1000 * 60 * 60 * 24 * start.getDate());

  const dailyProblems = await DailyProblem.find({
    $and: [{ date: { $gte: start } }, { date: { $lte: end } }],
  });

  const handle = await Handle.findById(req.user.handle);

  const submittedDaily = getSubmittedDailyInRange(start, end, handle.daily);
  //this is the list of problmes submitted by user in particular date range(start, end)

  const problems = [];

  for (let index = 0; index < dailyProblems.length; index++) {
    const element = dailyProblems[index];
    const rank = getRank(handle.rankChanges, element.date);
    const prob = getProblem(element, rank);
    problems.push({
      ...prob,
      solved: checkIfSolved(element.date, submittedDaily), //marking if user have solved this problem or not.
      date: element.date,
    });
  }

  res.status(200).json({
    data: problems,
  });
});
