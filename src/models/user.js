const pool = require("../config/database")

const findEmail = async (email) => {
    const result = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
    );

    return result.rows[0];
}


const createUser = async (first_name,last_name,email,mobile,password_hash) => {
    const result = await pool.query(
        `INSERT INTO users
        (first_name,last_name,email,mobile,password_hash)
        VALUES($1,$2,$3,$4,$5)
        RETURNING id,first_name,last_name,email,mobile,email_verified,status,created_at`,
        [first_name,last_name,email,mobile,password_hash]
    );

    return result.rows[0]
}


const saveResetToken = async (email,token,expires) => {
    
    const result = await pool.query(
        `UPDATE users
        SET reset_password_token = $1,
        reset_password_expires = $2
        WHERE email = $3
        RETURNING id,email,reset_password_token,reset_password_expires`,
        [token,expires,email]
    )

    return result.rows[0]

}

const findByResetToken = async (token) => {
    
    const result = await pool.query(
        `SELECT * FROM users
        WHERE reset_password_token = $1
        AND reset_password_expires > NOW()`,
        [token]
    )

    return result.rows[0]

}

const updatePassword = async (id,password_hash) => {
    const result = await pool.query(
        `UPDATE users
        SET password_hash = $1,
            reset_password_token = NULL,
            reset_password_expires = NULL
        WHERE id = $2
        RETURNING id,email`,
        [password_hash,id]
    )

    return result.rows[0]
}


const saveVerificationToken = async (email,token,expires) => {
    
    const result = await pool.query(
        `UPDATE users
        SET email_verification_token = $1,
        email_verification_expires = $2
        WHERE email = $3
        RETURNING id,email,email_verification_expires`,
        [token,expires,email]
    );

    return result.rows[0]

}

const findByVerificationToken = async (token) => {
    const result = await pool.query(
        `SELECT * FROM users
        WHERE email_verification_token = $1
        AND email_verification_expires > NOW()`,
        [token]
    );

    return result.rows[0]
}

const verifyUserEmail = async (id) => {
    const result = await pool.query(
        `UPDATE users
        SET email_verified = true,
        email_verification_token = NULL,
        email_verification_expires = NULL
        WHERE id = $1
        RETURNING id,email,email_verified`,
        [id]
    );

    return result.rows[0]
}


const saveRefreshTokenHash = async (id, tokenHash) => {
    const result = await pool.query(
        `UPDATE users
         SET refresh_token_hash = $1
         WHERE id = $2
         RETURNING id`,
        [tokenHash, id]
    );

    return result.rows[0];
};

const clearRefreshTokenHash = async (id) => {
    const result = await pool.query(
        `UPDATE users
         SET refresh_token_hash = NULL
         WHERE id = $1
         RETURNING id`,
        [id]
    );

    return result.rows[0];
};


const getProfileById = async (id) => {
    const result = await pool.query(
        `SELECT id, first_name, last_name, email, mobile,
                email_verified, status, created_at
         FROM users
         WHERE id = $1`,
        [id]
    );

    return result.rows[0];
};


const getAllCustomers = async () => {
    const result = await pool.query(`
        SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.mobile,
            u.email_verified,
            u.status,
            u.created_at,
            COUNT(o.id)::INTEGER AS total_orders,
            COALESCE(SUM(
                CASE
                    WHEN o.payment_status = 'paid'
                    THEN o.total_amount
                    ELSE 0
                END
            ), 0) AS total_spent
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
    `);

    return result.rows;
};

const getCustomerById = async (id) => {
    const result = await pool.query(
        `SELECT
            id,
            first_name,
            last_name,
            email,
            mobile,
            email_verified,
            status,
            created_at
         FROM users
         WHERE id = $1`,
        [id]
    );

    return result.rows[0];
};

const deleteCustomer = async (id) => {
  const result = await pool.query(
    `DELETE FROM users
     WHERE id = $1
     RETURNING id, first_name, last_name, email`,
    [id]
  );

  return result.rows[0];
};

const deactivateCustomer = async (id) => {
  const result = await pool.query(
    `UPDATE users
     SET status = 'inactive',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, first_name, last_name, email, status`,
    [id]
  );

  return result.rows[0];
};


module.exports = {
    findEmail,
    createUser,
    saveResetToken,
    findByResetToken,
    updatePassword,
    saveVerificationToken,
    findByVerificationToken,
    verifyUserEmail,
    saveRefreshTokenHash,
    clearRefreshTokenHash,
    getProfileById,
    getAllCustomers,
    getCustomerById,
    deleteCustomer,
    deactivateCustomer
}