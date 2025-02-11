const CartModel = require("../models/cartModel");

const CartController = {
  addToCart: (req, res) => {
    const { product_id, quantity, price } = req.body;
    const user_id = req.user.id;

    if (!product_id || !quantity || !price) {
      return res.status(400).json({ error: "All fields are required" });
    }

    CartModel.addToCart(user_id, product_id, quantity, price, (err) => {
      if (err) {
        console.error("Failed to add to cart:", err);
        return res.status(500).json({ error: "Failed to add item to cart" });
      }
      res.status(200).json({ message: "Item added to cart successfully" });
    });
  },

  getCart: (req, res) => {
    const user_id = req.user.id;

    CartModel.getCartByUserId(user_id, (err, results) => {
      if (err) {
        console.error("Failed to fetch cart:", err);
        return res.status(500).json({ error: "Failed to fetch cart" });
      }
      res.status(200).json(results);
    });
  },

  removeItem: (req, res) => {
    const user_id = req.user.id;
    const cart_id = req.params.id;

    CartModel.removeItemFromCart(cart_id, user_id, (err) => {
      if (err) {
        console.error("Failed to remove item from cart:", err);
        return res.status(500).json({ error: "Failed to remove item from cart" });
      }
      res.status(200).json({ message: "Item removed from cart successfully" });
    });
  },

  clearCart: (req, res) => {
    const user_id = req.user.id;

    CartModel.clearCart(user_id, (err) => {
      if (err) {
        console.error("Failed to clear cart:", err);
        return res.status(500).json({ error: "Failed to clear cart" });
      }
      res.status(200).json({ message: "Cart cleared successfully" });
    });
  },
};

module.exports = CartController;
