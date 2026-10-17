const jwt = require("jsonwebtoken")

const authMiddleware = async (req,res,next) => {
    
    const token = req.headers.authorization?.split(" ")[1];

    if(!token){
        return res.status(401).json({
            message:"access token is required"
        })
    }

    try {
        
        const user = jwt.verify(token,process.env.JWT_ACCESS_SECRET)

        req.user = user

        next()


    } catch (error) {
        return res.status(401).json({
            message:"invalid token"
        })
    }

}

module.exports = {
    authMiddleware
}