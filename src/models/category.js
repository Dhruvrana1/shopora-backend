
const pool = require("../config/database");

const createCategory = async (
  parent_id,
  name,
  slug,
  description,
  image,
  meta_title,
  meta_description,
  status,
  sort_order
) => {
  const result = await pool.query(
    `INSERT INTO categories
      (parent_id, name, slug, description, image, meta_title,
       meta_description, status, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      parent_id,
      name,
      slug,
      description,
      image,
      meta_title,
      meta_description,
      status,
      sort_order,
    ]
  );

  return result.rows[0];
};

const getCategory = async () => {
  const result = await pool.query(
    `SELECT * FROM categories
     ORDER BY sort_order ASC, id ASC`
  );

  return result.rows;
};

const getCategoryById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM categories WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

const updateCategory = async (
  parent_id,
  name,
  slug,
  description,
  image,
  meta_title,
  meta_description,
  status,
  sort_order,
  id
) => {
  const result = await pool.query(
    `UPDATE categories
     SET parent_id = $1,
         name = $2,
         slug = $3,
         description = $4,
         image = $5,
         meta_title = $6,
         meta_description = $7,
         status = $8,
         sort_order = $9,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $10
     RETURNING *`,
    [
      parent_id,
      name,
      slug,
      description,
      image,
      meta_title,
      meta_description,
      status,
      sort_order,
      id,
    ]
  );

  return result.rows[0];
};

const deleteCategory = async (id) => {
  const result = await pool.query(
    `DELETE FROM categories
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0];
};

const getCategoryBySlug = async (slug) => {
  const result = await pool.query(
    `SELECT * FROM categories WHERE slug = $1`,
    [slug]
  );

  return result.rows[0];
};

const getProductsByCategorySlug = async (slug) => {
  const result = await pool.query(
    `SELECT p.*
     FROM products p
     JOIN categories c ON p.category_id = c.id
     WHERE c.slug = $1`,
    [slug]
  );

  return result.rows;
};

module.exports = {
  createCategory,
  getCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryBySlug,
  getProductsByCategorySlug,
};
