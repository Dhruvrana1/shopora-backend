const pool = require("../config/database")

const createPayment = async ( order_id,
    payment_gateway,
    transaction_id,
    amount,
    payment_status) => {
    
    const result = await pool.query(
        `INSERT INTO payments
        ( order_id,
    payment_gateway,
    transaction_id,
    amount,
    payment_status)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *`,
    [ order_id,
    payment_gateway,
    transaction_id,
    amount,
    payment_status]
    )

    return result.rows[0]

}

module.exports = {
    createPayment
}