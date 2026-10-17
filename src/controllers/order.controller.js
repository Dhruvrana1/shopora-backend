
const crypto = require("crypto");
const pool = require("../config/database");
const order = require("../models/orders");
const orderItems = require("../models/orderItem");

const createOrder = async (req, res) => {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        const user_id = req.user.id;
        const {
            shipping_address,
            billing_address,
            items
        } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "At least one order item is required"
            });
        }

        if (!shipping_address) {
            return res.status(400).json({
                message: "Shipping address is required"
            });
        }

        for (const item of items) {
            if (
                !Number.isInteger(Number(item.product_id)) ||
                Number(item.product_id) <= 0 ||
                !Number.isInteger(Number(item.quantity)) ||
                Number(item.quantity) <= 0
            ) {
                return res.status(400).json({
                    message:
                        "Each item needs a valid product_id and positive integer quantity"
                });
            }
        }

        await client.query("BEGIN");
        transactionStarted = true;

        // Combine duplicate product IDs.
        const quantities = new Map();

        for (const item of items) {
            const id = Number(item.product_id);

            quantities.set(
                id,
                (quantities.get(id) || 0) + Number(item.quantity)
            );
        }

        const productIds = [...quantities.keys()];

        const productResult = await client.query(
            `SELECT id, name, sku, price, sale_price, stock_quantity
             FROM products
             WHERE id = ANY($1::int[])
             ORDER BY id
             FOR UPDATE`,
            [productIds]
        );

        const productsById = new Map(
            productResult.rows.map(product => [
                Number(product.id),
                product
            ])
        );

        if (productsById.size !== productIds.length) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(400).json({
                message: "One or more products do not exist"
            });
        }

        let subtotal = 0;
        const orderLines = [];

        for (const [productId, quantity] of quantities) {
            const product = productsById.get(productId);

            if (Number(product.stock_quantity) < quantity) {
                await client.query("ROLLBACK");
                transactionStarted = false;

                return res.status(400).json({
                    message: `Insufficient stock for product ${productId}`
                });
            }

            // Use prices stored in the database.
            const regularPrice = Number(product.price);

            const salePrice = product.sale_price == null
                ? null
                : Number(product.sale_price);

            const price =
                salePrice !== null &&
                salePrice > 0 &&
                salePrice < regularPrice
                    ? salePrice
                    : regularPrice;

            if (!Number.isFinite(price) || price < 0) {
                throw new Error(
                    `Invalid database price for product ${productId}`
                );
            }

            const lineTotal =
                Math.round(price * 100 * quantity) / 100;

            subtotal =
                Math.round((subtotal + lineTotal) * 100) / 100;

            orderLines.push({
                product_id: product.id,
                product_name: product.name,
                sku: product.sku,
                quantity,
                price,
                total: lineTotal
            });
        }

        // Shipping and tax remain zero for now.
        const shipping_charge = 0;
        const tax = 0;

        const total_amount =
            Math.round(
                (subtotal + shipping_charge + tax) * 100
            ) / 100;

        const order_number = `SHOP-${crypto.randomUUID()}`;

        const createdOrder = await order.createOrder(
            user_id,
            order_number,
            subtotal,
            shipping_charge,
            tax,
            total_amount,
            "pending",
            "pending",
            shipping_address,
            billing_address || shipping_address,
            client
        );

        const savedItems = [];

        for (const item of orderLines) {
            const savedItem = await orderItems.createOrderItems(
                createdOrder.id,
                item.product_id,
                item.product_name,
                item.sku,
                item.quantity,
                item.price,
                item.total,
                client
            );

            savedItems.push(savedItem);
        }

        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(201).json({
            message: "Order created successfully",
            order: createdOrder,
            items: savedItems
        });
    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK");
        }

        console.error("Error creating order:", error);

        return res.status(500).json({
            message: "Unable to create order"
        });
    } finally {
        client.release();
    }
};

// Retrieve all orders for the logged-in customer.
const getOrder = async (req, res) => {
    try {
        const user_id = req.user.id;
        const orders = await order.getOrders(user_id);

        return res.status(200).json({ orders });
    } catch (error) {
        console.error("Error getting orders:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// Retrieve one order and its items.
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const foundOrder = await order.getOrderById(id, user_id);

        if (!foundOrder) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const items = await orderItems.getOrderItemsByOrderId(
            foundOrder.id
        );

        return res.status(200).json({
            order: {
                ...foundOrder,
                items
            }
        });
    } catch (error) {
        console.error("Error getting order:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


const getAllOrdersAdmin = async (req, res) => {
    try {
        const orders = await order.getAllOrders();

        return res.status(200).json({ orders });
    } catch (error) {
        console.error("Error getting all admin orders:", error);

        return res.status(500).json({
            message: "Unable to retrieve orders"
        });
    }
};


const getAdminOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const foundOrder = await order.getAdminOrderById(id);

        if (!foundOrder) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const items = await orderItems.getOrderItemsByOrderId(
            foundOrder.id
        );

        return res.status(200).json({
            order: {
                ...foundOrder,
                items
            }
        });

    } catch (error) {
        console.error("Admin order details error:", error);

        return res.status(500).json({
            message: "Unable to retrieve order details"
        });
    }
};


const updateOrderStatusAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { order_status } = req.body || {};;

        if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const allowedStatuses = [
            "pending",
            "processing",
            "shipped",
            "delivered",
            "cancelled"
        ];

        if (!allowedStatuses.includes(order_status)) {
            return res.status(400).json({
                message: "Invalid order status",
                allowedStatuses
            });
        }

        const updatedOrder = await order.updateOrderStatus(
            Number(id),
            order_status
        );

        if (!updatedOrder) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        return res.status(200).json({
            message: "Order status updated successfully",
            order: updatedOrder
        });
    } catch (error) {
        console.error("Admin order status update error:", error);

        return res.status(500).json({
            message: "Unable to update order status"
        });
    }
};



module.exports = {
    createOrder,
    getOrder,
    getOrderById,
    getAllOrdersAdmin,
    getAdminOrderDetails,
    updateOrderStatusAdmin
};
