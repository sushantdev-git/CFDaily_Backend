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

  return dailySubmission.slice(startInd, endInd);
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

module.exports = {
  calculateStreak,
  checkIfSolved,
  getSubmittedDailyInRange
}