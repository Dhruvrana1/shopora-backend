const express = require("express")
const cartController = require("../controllers/cart.controller")
const {authMiddleware:auth} = require("../middlewares/auth.middleware")

const router = express.Router();

router.get("/cart",auth,cartController.getCart)
router.post("/cart/items",auth,cartController.addToCart)

router.put("/cart/items/:id",auth,cartController.updateCartItem)
router.delete("/cart/items/:id",auth,cartController.deleteCartItem)

module.exports = router