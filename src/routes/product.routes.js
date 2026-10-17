const express = require("express");
const productController = require("../controllers/product.controller");
const upload = require("../middlewares/upload");

const {
  authAdminMiddleware,
} = require("../middlewares/admin.middleware");

const router = express.Router();

router.post(
  "/admin/products",
  authAdminMiddleware,
  productController.createProduct
);

router.get(
  "/products",
  productController.getProducts
);

router.get(
  "/products/:slug",
  productController.getProductBySlug
);

router.put(
  "/admin/products/:id",
  authAdminMiddleware,
  productController.updateProduct
);

router.delete(
  "/admin/products/:id",
  authAdminMiddleware,
  productController.deleteProduct
);

router.post(
  "/admin/products/images",
  authAdminMiddleware,
  upload.single("image"),
  productController.addProductImage
);

// NEW: Delete a specific product image.
router.delete(
  "/admin/products/images/:imageId",
  authAdminMiddleware,
  productController.deleteProductImage
);

module.exports = router;