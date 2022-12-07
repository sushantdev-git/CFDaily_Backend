const calculateStreak = (dates) => {
  dates = dates.map((date) => new Date(Date.parse(date)));
  dates.sort((a, b) => {
    const diff = a.getTime() - b.getTime();
    return diff;
  });

  let streak = 1,
    maxStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    if ((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24) <= 1) {
      streak++;
    } else streak = 1;
    maxStreak = Math.max(maxStreak, streak);
  }

  return [streak, maxStreak];
};

const bsearh = (r, condition) => {
  let l = 0;

  while (l < r) {
    let mid = Math.floor(l + (r - l) / 2);
    [l, r] = condition(l, r, mid);
  }

  return l;
};

const getSubmittedDailyInRange = (lb, ub, dailySubmission) => {
  const n = dailySubmission.length;

  let startInd = bsearh(n, (l, r, mid) => {
    if (dailySubmission[mid] < lb) return [mid + 1, r];
    return [l, mid];
  });

  let endInd = bsearh(n, (l, r, mid) => {
    if (dailySubmission[mid] <= ub) return [mid + 1, r];
    return [l, mid];
  });

  return dailySubmission.slice(startInd, endInd-startInd+1);
};

const checkIfSolved = (currentDate, dailySubmission) => {
  //this function is checking if user have solved problem on current date.
  for (let i = 0; i < dailySubmission.length; i++) {
    if (dailySubmission[i].getDate() == currentDate.getDate()) {
      return true;
    }
  }
  return false;
};

const getQuestionSolvedTime = (question) => {
  return question.creationTimeSeconds * 1000
}

const findBounds = async (submissions, dcDate) => {
  
  //submisstion is not in sorted order so first we have to sort it
  submissions.sort((a,b) => {
    return a.creationTimeSeconds - b.creationTimeSeconds;
  });

  const date = new Date(Date.parse(dcDate));

  const lb = date, ub = new Date(date.getTime() + 24*60*60*1000 - 1);
  //then we are creating upper bound and lower bound for day, on which question have to be solved.

  const n = submissions.length-1;

  let startInd = bsearh(n, (l, r, mid) => {
    const solvedTime = getQuestionSolvedTime(submissions[mid]);
    if (solvedTime < lb) return [mid + 1, r];
    return [l, mid];
  });

  let endInd = bsearh(n+1, (l, r, mid) => {
    const solvedTime = getQuestionSolvedTime(submissions[mid]);
    if (solvedTime <= ub) return [mid + 1, r];
    return [l, mid];
  });

  //after doing binary search we have indexes for problems solved on this particular day
  return [startInd, endInd];
};

const isSubmitted = async (submissions, date, questionName) => {
  
  const [lb, ub] = await findBounds(submissions, date);
  //finding upper bound and lower bound for submission on this particular date

  //then checking if user have solved this problem on this particular date.
  for (let i = lb; i < ub; i++) {
    if (
      submissions[i].problem.name === questionName &&
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


module.exports = {
  calculateStreak,
  checkIfSolved,
  getSubmittedDailyInRange,
  isSubmitted,
  getRank
}