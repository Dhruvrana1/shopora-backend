const express = require("express")
const {authMiddleware:auth} = require("../middlewares/auth.middleware")
const paymentController = require("../controllers/payment.controller")

const router = express.Router()

router.post("/payments/create",auth,paymentController.createPayment)
router.post("/payments/verify",auth,paymentController.verifyPayment)

module.exports = router