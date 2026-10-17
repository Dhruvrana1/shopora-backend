const express = require("express")
const categoryController = require("../controllers/category.controller")
const {
    authAdminMiddleware
} = require("../middlewares/admin.middleware");
const upload = require("../middlewares/upload");

const router = express.Router()

router.post("/admin/categories",authAdminMiddleware,categoryController.categoryCreation)
router.get("/admin/categories",authAdminMiddleware,categoryController.getCategories)
router.get("/admin/categories/:id",authAdminMiddleware,categoryController.getCategoryById)
router.put("/admin/categories/:id",authAdminMiddleware,categoryController.updateCategory)
router.delete("/admin/categories/:id",authAdminMiddleware,categoryController.deleteCategory)

router.get("/categories",categoryController.getCustomerCategories)
router.get("/categories/:slug",categoryController.getCategoryBySlug)

router.post(
  "/admin/categories/image",
  authAdminMiddleware,
  upload.single("image"),
  categoryController.uploadCategoryImage
);

router.get("/categories/:slug/products",categoryController.getProductsCategoryBySlug)

module.exports = router

