const express = require("express")
const cors = require("cors");
const cookieParser = require("cookie-parser")
const authRoutes = require("./routes/auth.routes")
const categoryRoutes = require("./routes/category.routes")
const productRoutes = require("./routes/product.routes")
const cartRoutes = require("./routes/cart.routes")
const orderRoutes = require("./routes/order.routes")
const paymentRoutes = require("./routes/payment.routes")
const adminRoutes = require("./routes/admin.routes")
const adminOrderRoutes = require("./routes/admin.order.routes");
const adminCustomerRoutes = require("./routes/admin.customer.routes");

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174"
  ],
  credentials: true
}));

app.use("/api/auth",authRoutes)
app.use("/api",categoryRoutes)
app.use("/api",productRoutes)
app.use("/api",cartRoutes)
app.use("/api",orderRoutes)
app.use("/api",paymentRoutes)
app.use("/api/admin/auth", adminRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/customers", adminCustomerRoutes);


module.exports = app