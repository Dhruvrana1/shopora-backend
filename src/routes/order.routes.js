const express = require("express")
const{authMiddleware:auth} = require("../middlewares/auth.middleware")
const orderController = require("../controllers/order.controller")

const router = express.Router()

router.post("/orders",auth,orderController.createOrder)
router.get("/orders",auth,orderController.getOrder)
router.get("/orders/:id",auth,orderController.getOrderById)


module.exports = router

