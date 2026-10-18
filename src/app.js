
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const adminRoutes = require("./routes/admin.routes");
const adminOrderRoutes = require("./routes/admin.order.routes");
const adminCustomerRoutes = require("./routes/admin.customer.routes");

const app = express();

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://shopora-frontend-eight.vercel.app",
  "https://shopora-admin-psi.vercel.app"
];

// Allow only your known customer preview deployment pattern.
const isAllowedPreview = (origin) =>
  /^https:\/\/shopora-frontend-[a-z0-9-]+\.vercel\.app$/.test(
    origin || ""
  );

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header (e.g. server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin) ||
        isAllowedPreview(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked origin: ${origin}`)
      );
    },
    credentials: true,
  })
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);
app.use("/api", paymentRoutes);
app.use("/api/admin/auth", adminRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/customers", adminCustomerRoutes);

module.exports = app;
