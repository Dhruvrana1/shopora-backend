const razorpay = require("../config/razorpay")
const payment = require("../models/payments")
const crypto = require("crypto")
const Order = require("../models/orders")


const createPayment = async (req, res) => {
    try {
        const { order_id } = req.body;

        if (!order_id) {
            return res.status(400).json({
                message: "order_id is required"
            });
        }

        // Get the customer's order from the database
        const order = await Order.getOrderById(
            order_id,
            req.user.id
        );

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        // Prevent creating another payment for an already-paid order
        if (order.payment_status === "paid") {
            return res.status(400).json({
                message: "Order is already paid"
            });
        }

        // Use the database amount, not the amount from the request
        const amount = Number(order.total_amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                message: "Invalid order amount"
            });
        }

        const razorPayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `order_${order.id}`
        });

        return res.status(200).json({
            message: "Payment order created",
            razorPayOrder
        });

    } catch (error) {
        console.error("Error creating payment:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const verifyPayment = async (req,res) => {

    try {
        
        const{
            order_id,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body

        if(!order_id||!razorpay_order_id||!razorpay_payment_id||!razorpay_signature){
            return res.status(400).json({
                message:"payment details are required"
            })
        }

        const generatedSignature = crypto
        .createHmac("sha256",process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex")

        if(generatedSignature !== razorpay_signature){
            return res.status(400).json({
                message:"payment verification failed"
            })
        }

        const order = await Order.getOrderById(
            order_id,
            req.user.id
        )

        if(!order){
            return res.status(400).json({
                message:"order not found"
            })
        }

        const savePayment = await payment.createPayment(
            order_id,
            "Razorpay",
            razorpay_payment_id,
            order.total_amount,
            "paid"
        )

        await Order.updatePayment(order_id,"paid")

        return res.status(200).json({
            message:"payment verification successfull",
            payment : savePayment
        })

    } catch (error) {
        console.error("error in verifying payment",error)

        return res.status(500).json({
            message:"internal server error"
        })
    }

}



module.exports = {
    createPayment,
    verifyPayment
}