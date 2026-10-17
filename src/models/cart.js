const pool = require("../config/database")

const createCart = async (user_id) => {
    
    const result = await pool.query(
        `INSERT INTO carts (user_id)
        VALUES ($1)
        RETURNING *`,
        [user_id]
    )

    return result.rows[0]

}

const getCartByUserId = async (user_id) => {
    
    const result = await pool.query(
        `SELECT * FROM carts
        WHERE user_id = $1`,
        [user_id]
    )

    return result.rows[0]

}

const getCartItems = async (cart_id) => {
    const result = await pool.query(
        `SELECT * 
        FROM cart_items
        WHERE cart_id = $1
        ORDER BY id ASC`,
        [cart_id]
    )

    return result.rows[0]
}

const addCartItem = async (cart_id,product_id,quantity,price) => {
    
    const result = await pool.query(
        `INSERT INTO cart_items
        (cart_id, product_id, quantity, price)
        VALUES ($1,$2,$3,$4)
        RETURNING *`,
        [cart_id, product_id, quantity, price]
    )

    return result.rows[0]

}

const updateCartItems = async (id,quantity) => {
    
    const result = await pool.query(
        `UPDATE cart_items
        SET quantity = $1
        WHERE id = $2
        RETURNING *`,
        [quantity,id]
    )

    return result.rows[0]

}

const deleteCartItems = async (id) => {
    
    const result = await pool.query(
        `DELETE FROM cart_items
        WHERE id = $1
        RETURNING *`,
        [id]
    )

    return result.rows[0]

}

module.exports = {
    createCart,
    getCartByUserId,
    getCartItems,
    addCartItem,
    updateCartItems,
    deleteCartItems
}