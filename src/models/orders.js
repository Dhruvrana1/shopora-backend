
const pool = require("../config/database");

// Create a new order.
const createOrder = async (
  user_id,
  order_number,
  subtotal,
  shipping_charge,
  tax,
  total_amount,
  payment_status,
  order_status,
  shipping_address,
  billing_address,
  client = pool
) => {
  const result = await client.query(
    `INSERT INTO orders (
      user_id,
      order_number,
      subtotal,
      shipping_charge,
      tax,
      total_amount,
      payment_status,
      order_status,
      shipping_address,
      billing_address
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      user_id,
      order_number,
      subtotal,
      shipping_charge,
      tax,
      total_amount,
      payment_status,
      order_status,
      shipping_address,
      billing_address,
    ]
  );

  return result.rows[0];
};

// Get orders for a specific customer.
const getOrders = async (user_id) => {
  const result = await pool.query(
    `SELECT *
     FROM orders
     WHERE user_id = $1
     ORDER BY id DESC`,
    [user_id]
  );

  return result.rows;
};

// Get one order belonging to a specific customer.
const getOrderById = async (id, user_id) => {
  const result = await pool.query(
    `SELECT *
     FROM orders
     WHERE id = $1 AND user_id = $2`,
    [id, user_id]
  );

  return result.rows[0];
};

// Update payment status.
const updatePayment = async (
  id,
  payment_status,
  client = pool
) => {
  const result = await client.query(
    `UPDATE orders
     SET payment_status = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [payment_status, id]
  );

  return result.rows[0];
};

// Get all orders WITH customer information for the admin page.
const getAllOrders = async () => {
  const result = await pool.query(
    `SELECT
       o.*,
       u.first_name,
       u.last_name,
       u.email,
       u.mobile
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     ORDER BY o.id DESC`
  );

  return result.rows;
};

// Get one order with customer information for the admin.
const getAdminOrderById = async (id) => {
  const result = await pool.query(
    `SELECT
       o.*,
       u.first_name,
       u.last_name,
       u.email,
       u.mobile
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     WHERE o.id = $1`,
    [id]
  );

  return result.rows[0];
};

// Update an order's status.
const updateOrderStatus = async (id, order_status) => {
  const result = await pool.query(
    `UPDATE orders
     SET order_status = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [order_status, id]
  );

  return result.rows[0];
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updatePayment,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
};
