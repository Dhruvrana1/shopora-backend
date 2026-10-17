
const express = require("express");
const router = express.Router();

const customerController = require("../controllers/admin.customer.controller");
const {
    authAdminMiddleware
} = require("../middlewares/admin.middleware");

router.get("/", authAdminMiddleware, customerController.getAllCustomers);
router.get("/:id", authAdminMiddleware, customerController.getCustomerById);
router.delete(
  "/:id",
  authAdminMiddleware,
  customerController.deleteCustomer
);
router.patch(
  "/:id/deactivate",
  authAdminMiddleware,
  customerController.deactivateCustomer
);

module.exports = router;
