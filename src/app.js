const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const customerRoutes = require("./routes/customer.routes");
const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const addressRoutes = require("./routes/addresses.routes");
const orderRoutes = require("./routes/order.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}))
app.use(express.json());
app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);

app.use(errorHandler);
module.exports = app;