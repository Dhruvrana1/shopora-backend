
const express = require("express");
const orderController = require("../controllers/order.controller");
const {
    authAdminMiddleware
} = require("../middlewares/admin.middleware");

const router = express.Router();

// Admin: view all customer orders
router.get(
    "/",
    authAdminMiddleware,
    orderController.getAllOrdersAdmin
);

router.get(
    "/:id",
    authAdminMiddleware,
    orderController.getAdminOrderDetails
);


router.patch(
    "/:id/status",
    authAdminMiddleware,
    orderController.updateOrderStatusAdmin
);


module.exports = router;
