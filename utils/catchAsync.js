const AppError = require("./appError");

module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => {
      console.log(err);
      if (err.message === "jwt expired")
        next(new AppError(401, "access token expired"));
      next(err);
    });
  };
};
