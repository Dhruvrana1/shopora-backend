require("dotenv").config()

const app = require("./src/app")
require("./src/config/database")

app.listen(process.env.PORT,()=>{
    console.log("server is running...")
})