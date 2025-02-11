const db = require("../db");

const CartModel = {
  addToCart: (user_id, product_id, quantity, price, callback) => {
    const query = `
      INSERT INTO cart (user_id, product_id, quantity, price) 
      VALUES (?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE quantity = quantity + ?`;
    db.query(query, [user_id, product_id, quantity, price, quantity], callback);
  },

  getCartByUserId: (user_id, callback) => {
    const query = `
      SELECT c.id, p.name, c.quantity, c.price 
      FROM cart c 
      JOIN products p ON c.product_id = p.id 
      WHERE c.user_id = ?`;
    db.query(query, [user_id], callback);
  },

  removeItemFromCart: (cart_id, user_id, callback) => {
    const query = `DELETE FROM cart WHERE id = ? AND user_id = ?`;
    db.query(query, [cart_id, user_id], callback);
  },

  clearCart: (user_id, callback) => {
    const query = `DELETE FROM cart WHERE user_id = ?`;
    db.query(query, [user_id], callback);
  },
};

module.exports = CartModel;
