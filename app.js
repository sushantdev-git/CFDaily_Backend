const express = require("express");
const cors = require("cors");

const globalErrorHandler = require("./controllers/errorController");
const userRouter = require("./routes/userRoutes");
const problemRouter = require("./routes/problemRoutes");

const AppError = require("./utils/appError");

const app = express();

const corsOpts = {
  origin: '*',
  methods: '*',
};

app.use(cors(corsOpts));

app.use(express.json());
app.use("/api/v1/users/", userRouter);
app.use("/api/v1/problems", problemRouter);
app.all("*", (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server.`));
});
app.use(globalErrorHandler);

module.exports = app;
