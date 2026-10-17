
const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false
});

pool.connect()
    .then((client) => {
        console.log("db connected successfully");
        client.release();
    })
    .catch((error) => {
        console.log("db connection failed", error.message);
    });

module.exports = pool;
