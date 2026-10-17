const cart = require("../models/cart")
const productModel = require("../models/products")

const getCart = async (req,res) => {
    
    try {
        
        const user_id = req.user.id

        let userCart = await cart.getCartByUserId(user_id)

        if(!userCart){
            userCart = await cart.createCart(user_id)
        }

        const items = await cart.getCartItems(userCart.id)

        return res.status(200).json({
            cart:userCart,
            items
        })

    } catch (error) {
        console.error("error in getting the cart",error)

        return res.status(500).json({
            message:"internal server error"
        })
    }

}

const addToCart = async (req,res) => {
    
    try {
        
        const user_id = req.user.id

        const{product_id,quantity} = req.body

        if(!product_id || !quantity){
            return res.status(400).json({
                message:"product id and quantity is required"
            })
        }

        let userCart = await cart.getCartByUserId(user_id)

        if(!userCart){
            userCart = await cart.createCart(user_id)
        }

        const product = await productModel.getProductById(product_id)

        if(!product){
            return res.status(404).json({
                message:"product not found"
            })
        }

        if(product.stock_quantity < quantity){
            return res.status(400).json(
                {
                    message:"insufficient stock of the product"
                }
            )
        }

        const cartItem = await cart.addCartItem(
            userCart.id,
            product_id,
            quantity,
            product.price 
        )

        return res.status(201).json({
            message:"product added to cart",
            item:cartItem
        })

    } catch (error) {
        console.error("Error in adding to cart",error)

        return res.status(500).json({
            message:"internal server error"
        })
    }

}

const updateCartItem = async (req,res) => {
    
    try {
        
        const {id} = req.params
        const {quantity} = req.body

        if(!quantity){
            return res.status(400).json({
                message:"quantity is required"
            })
        }

        const cartItem = await cart.updateCartItems(id,quantity)

        if(!cartItem){
            return res.status(400).json({
                message:"item not found"
            })
        }

        return res.status(200).json({
            message:"cart updated successfully",
            item:cartItem

        })

    } catch (error) {
        console.error("error in updating the cart",error)

        return res.status(500).json({
            message:"internal server error"
        })
    }

}

const deleteCartItem = async (req,res) => {
    
    try {
        
        const {id} = req.params

        const deleteCart = await cart.deleteCartItems(id)

        if(!deleteCart){
            return res.status(404).json({
                message:"cart item not found"
            })
        }

        return res.status(200).json({
            message:"cart deleted successfully"
        })

    } catch (error) {
        console.error("error in deleting cart",error)

        return res.status(500).json({
            message:"internal server error"
        })
    }

}

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    deleteCartItem
}