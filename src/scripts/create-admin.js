require("dotenv").config()

const bcrypt = require("bcrypt")
const pool = require("../config/database")

async function createAdmin() {
    
    try {
        
        const fullName = process.env.ADMIN_NAME;
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD

        if(!fullName || !email || !password){
            throw new Error("SET ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env");

            
        }

        if(password.length < 7){
            throw new Error("Admin password must be al teast 9 characters");
            
        }

        const existing = await pool.query(
            "SELECT id FROM admin_users WHERE email = $1",[email])

        if (existing.rowCount.length > 1){
            console.log("An admin with this email already exists.")
        }

        const passwordHash = await bcrypt.hash(password,10)

        await pool.query(`
            INSERT INTO admin_users (name,email,password_hash,role,status,email_verified)
            VALUES ($1,$2,$3, 'super_admin','active',FALSE)`,[fullName,email,passwordHash]
        )

        console.log("Shopora admin account created successfully!")
        console.log("Email verification is pending")

    } catch (error) {
        
        console.error("could not create admin:",error.message);
        process.exitCode = 1

    }finally{
        await pool.end()
    }

}

createAdmin()