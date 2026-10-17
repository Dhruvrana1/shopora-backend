const product = require("../models/products");
const { uploadImage } = require("../config/storage");

const createProduct = async (req, res) => {
  try {
    const {
      category_id,
      name,
      slug,
      sku,
      description,
      price,
      sale_price,
      stock_quantity,
      status,
      meta_title,
      meta_description,
    } = req.body;

    if (!category_id || !name || !slug || !sku || price == null || price === "") {
      return res.status(400).json({
        message: "category_id, name, slug, sku, and price are required",
      });
    }

    const Product = await product.createProduct(
      category_id,
      name,
      slug,
      sku,
      description,
      price,
      sale_price,
      stock_quantity,
      status,
      meta_title,
      meta_description
    );

    return res.status(201).json({
      message: "Product created successfully",
      product: Product,
    });
  } catch (error) {
    console.error("Error creating product:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const Product = await product.getProducts();

    return res.status(200).json({ Product });
  } catch (error) {
    console.error("Error getting products:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const Product = await product.getProductBySlug(slug);

    if (!Product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      product: Product,
    });
  } catch (error) {
    console.error("Error getting product:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      category_id,
      name,
      slug,
      sku,
      description,
      price,
      sale_price,
      stock_quantity,
      status,
      meta_title,
      meta_description,
    } = req.body;

    if (!category_id || !name || !slug || !sku || price == null || price === "") {
      return res.status(400).json({
        message: "category_id, name, slug, sku, and price are required",
      });
    }

    const Product = await product.updateProduct(
      id,
      category_id,
      name,
      slug,
      sku,
      description,
      price,
      sale_price,
      stock_quantity,
      status,
      meta_title,
      meta_description
    );

    if (!Product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      product: Product,
    });
  } catch (error) {
    console.error("Error updating product:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const Product = await product.deleteProduct(id);

    if (!Product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const addProductImage = async (req, res) => {
  try {
    const { product_id, alt_text, sort_order } = req.body;

    if (!product_id || !req.file) {
      return res.status(400).json({
        message: "product_id and image are required",
      });
    }

    const image_url = await uploadImage(req.file.path);

    const productImage = await product.addProductImage(
      product_id,
      image_url,
      alt_text || null,
      sort_order == null ? 0 : Number(sort_order)
    );

    return res.status(201).json({
      message: "Product image added successfully",
      image: productImage,
    });
  } catch (error) {
    console.error("Error adding product image:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// NEW: Delete one image record.
const deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    if (!/^\d+$/.test(imageId)) {
      return res.status(400).json({
        message: "A valid image ID is required",
      });
    }

    const deletedImage = await product.deleteProductImage(imageId);

    if (!deletedImage) {
      return res.status(404).json({
        message: "Product image not found",
      });
    }

    return res.status(200).json({
      message: "Product image deleted successfully",
      image: deletedImage,
    });
  } catch (error) {
    console.error("Error deleting product image:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
};