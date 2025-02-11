const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const db = require("../db");

// ✅ Add item to cart (Check API path and Debugging)
router.post("/", authenticateToken, (req, res) => {
  console.log("[DEBUG] Received Add to Cart request", req.body);
  const { name, quantity, price } = req.body;
  const user_id = req.user.id;

  if (!name || !quantity || !price) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  db.query(
    "INSERT INTO cart (user_id, name, quantity, price) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?",
    [user_id, name, quantity, price, quantity],
    (err) => {
      if (err) {
        console.error("[ERROR] Database error while adding to cart:", err);
        return res.status(500).json({ error: "Failed to add to cart." });
      }
      res.status(200).json({ message: "Item added to cart successfully." });
    }
  );
});

// ✅ Get user's cart
router.get("/", authenticateToken, (req, res) => {
  console.log("[DEBUG] Fetching user's cart");
  const user_id = req.user.id;

  db.query(
    "SELECT id, name, quantity, price FROM cart WHERE user_id = ?",
    [user_id],
    (err, results) => {
      if (err) {
        console.error("[ERROR] Database error while fetching cart:", err);
        return res.status(500).json({ error: "Failed to fetch cart." });
      }
      res.status(200).json(results);
    }
  );
});

// ✅ Remove item from cart
router.delete("/:id", authenticateToken, (req, res) => {
  console.log("[DEBUG] Removing item from cart", req.params.id);
  const user_id = req.user.id;
  const cart_id = req.params.id;

  db.query(
    "DELETE FROM cart WHERE id = ? AND user_id = ?",
    [cart_id, user_id],
    (err) => {
      if (err) {
        console.error("[ERROR] Database error while removing item from cart:", err);
        return res.status(500).json({ error: "Failed to remove item from cart." });
      }
      res.status(200).json({ message: "Item removed from cart successfully." });
    }
  );
});

// ✅ Clear cart
router.delete("/", authenticateToken, (req, res) => {
  console.log("[DEBUG] Clearing user's cart");
  const user_id = req.user.id;

  db.query("DELETE FROM cart WHERE user_id = ?", [user_id], (err) => {
    if (err) {
      console.error("[ERROR] Database error while clearing cart:", err);
      return res.status(500).json({ error: "Failed to clear cart." });
    }
    res.status(200).json({ message: "Cart cleared successfully." });
  });
});

module.exports = router;