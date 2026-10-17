const {Pool} = require("pg")

const pool = new Pool({
    host:process.env.DB_HOST,
    port:process.env.DB_PORT,
    database:process.env.DB_NAME,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD

})

pool.connect()
    .then(()=>{
        console.log("db connected successfully")
    })
    .catch((error)=>{
        console.log("db connection failed",error.message)
    })

module.exports = pool