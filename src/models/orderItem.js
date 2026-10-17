
const pool = require("../config/database");

// Create order items.
const createOrderItems = async (
    order_id,
    product_id,
    product_name,
    sku,
    quantity,
    price,
    total,
    client = pool
) => {
    const result = await client.query(
        `INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            sku,
            quantity,
            price,
            total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
            order_id,
            product_id,
            product_name,
            sku,
            quantity,
            price,
            total
        ]
    );

    return result.rows[0];
};

// Retrieve all items for a particular order.
const getOrderItemsByOrderId = async (order_id) => {
    const result = await pool.query(
        `SELECT *
         FROM order_items
         WHERE order_id = $1
         ORDER BY id ASC`,
        [order_id]
    );

    return result.rows;
};

module.exports = {
    createOrderItems,
    getOrderItemsByOrderId
};
