const pool = require("../config/database");

const createProduct = async (
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
) => {
  const result = await pool.query(
    `INSERT INTO products
      (category_id, name, slug, sku, description, price,
       sale_price, stock_quantity, status, meta_title, meta_description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
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
    ]
  );

  return result.rows[0];
};

const getProducts = async () => {
  const result = await pool.query(
    `SELECT
       p.*,
       COALESCE(
         (
           SELECT json_agg(
             json_build_object(
               'id', pi.id,
               'image_url', pi.image_url,
               'alt_text', pi.alt_text,
               'sort_order', pi.sort_order
             )
             ORDER BY pi.sort_order ASC, pi.id ASC
           )
           FROM product_images pi
           WHERE pi.product_id = p.id
         ),
         '[]'::json
       ) AS images
     FROM products p
     ORDER BY p.id ASC`
  );

  return result.rows;
};

const getProductBySlug = async (slug) => {
  const result = await pool.query(
    `SELECT * FROM products WHERE slug = $1`,
    [slug]
  );

  return result.rows[0];
};

const getProductById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM products WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

const updateProduct = async (
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
) => {
  const result = await pool.query(
    `UPDATE products
     SET category_id = $1,
         name = $2,
         slug = $3,
         sku = $4,
         description = $5,
         price = $6,
         sale_price = $7,
         stock_quantity = $8,
         status = $9,
         meta_title = $10,
         meta_description = $11,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $12
     RETURNING *`,
    [
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
      id,
    ]
  );

  return result.rows[0];
};

const deleteProduct = async (id) => {
  const result = await pool.query(
    `DELETE FROM products WHERE id = $1 RETURNING *`,
    [id]
  );

  return result.rows[0];
};

const addProductImage = async (
  product_id,
  image_url,
  alt_text,
  sort_order
) => {
  const result = await pool.query(
    `INSERT INTO product_images
       (product_id, image_url, alt_text, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [product_id, image_url, alt_text, sort_order]
  );

  return result.rows[0];
};

// NEW: Delete one image record from PostgreSQL.
const deleteProductImage = async (imageId) => {
  const result = await pool.query(
    `DELETE FROM product_images
     WHERE id = $1
     RETURNING *`,
    [imageId]
  );

  return result.rows[0];
};

module.exports = {
  createProduct,
  getProducts,
  getProductBySlug,
  getProductById,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
};