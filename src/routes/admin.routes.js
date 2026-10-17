const express = require("express");
const adminController = require("../controllers/admin.controller");
const {
    authAdminMiddleware
} = require("../middlewares/admin.middleware");

const router = express.Router();

// Public authentication endpoints.
router.post("/login", adminController.adminLogin);
router.post("/request-verification", adminController.requestAdminVerification);
router.get("/verify-email", adminController.verifyAdminEmail);

// Protected endpoint.
router.get("/me", authAdminMiddleware, adminController.getAdminProfile);
router.post("/refresh", adminController.refreshAdminToken);
router.post("/logout",authAdminMiddleware,adminController.adminLogout)

module.exports = router;
