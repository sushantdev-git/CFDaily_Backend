const express = require("express");

const authController = require("../controllers/authenticationController");
const userController = require("../controllers/userController");

const router = express.Router();

router.post("/signup", authController.signup, authController.sendOTP);
router.post("/login", authController.login);

router.post("/sendOtp", authController.sendOTP);
router.post("/verifyEmail", authController.verifyEmail);

router.post("/refreshToken", authController.refreshToken);

router.post("/forgotPassword", authController.forgotPassword);
router.post("/verifyOtp", authController.verifyOtp);
router.patch(
  "/resetPassword",
  authController.verifyToken,
  authController.resetPassword
);

router.get("/", authController.verifyToken, userController.getUser);
router.post("/addHandle", authController.verifyToken, userController.addHandle);
router.patch("/refresh", authController.verifyToken, userController.refresh);

module.exports = router;
