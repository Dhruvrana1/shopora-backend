const express = require("express")
const authController = require("../controllers/auth.controller")
const { authMiddleware } = require("../middlewares/auth.middleware")

const router = express.Router()

router.post("/register",authController.userRegister)

router.post("/login",authController.userLogin)

router.post("/forgot-password",authController.forgotPassword)

router.post("/reset-password",authController.resetPassword)

router.get("/verify-email", authController.verifyEmail);

router.post("/refresh", authController.refreshToken);

router.get("/profile", authMiddleware, authController.getProfile);

router.post(
    "/logout",
    authMiddleware,
    authController.userLogout
);          


module.exports = router