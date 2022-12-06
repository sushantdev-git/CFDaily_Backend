const express = require("express");

const authController = require("../controllers/authenticationController");
const problemsController = require("../controllers/problemsController");

const router = express.Router();

router.post(
  "/monthlyQuestions",
  authController.verifyToken,
  problemsController.monthlyQuestions
);
router.post(
  "/validate",
  authController.verifyToken,
  problemsController.validate
);

module.exports = router;
