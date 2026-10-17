const jwt = require("jsonwebtoken")

const pool = require("../config/database")


const authAdminMiddleware = async (req,res,next) => {
    
    const authorization = req.headers.authorization

    if(!authorization || !authorization.startsWith("Bearer ")){
        return res.status(404).json({
            message:"admin token is required"
        })
    }

    const token = authorization.split(" ")[1];

    try {
        
        const decoded = jwt.verify(token,process.env.JWT_ACCESS_SECRET);

        if(decoded.type !== "admin" || !decoded.id){
            return res.status(403).json({
                message:"admin access is required"
            })
        }

        const result = await pool.query(
            `SELECT id,email,name,role,status,email_verified
            FROM admin_users
            WHERE id = $1`,
            [decoded.id]
        )

        const admin = result.rows[0]

        if(!admin || admin.status !== "active"){
            return res.status(403).json({
                message:"admin account is inactive"
            })
        }

        if(!admin.email_verified){
            return res.status(403).json({
                message:"admin email verification is required"
            })
        }

        req.admin = {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
    };

    // 7. Continue to the controller
    return next();

    } catch (error) {
        if(
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                message: "Invalid or expired admin token"
            });
        }



        console.error("Admin authentication error:", error.message);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const requireSuperAdmin = (req, res, next) => {
    if (req.admin?.role !== "super_admin") {
        return res.status(403).json({
            message: "Super admin access required"
        });
    }

    next();
};

module.exports = {
    authAdminMiddleware,
    requireSuperAdmin
};
    