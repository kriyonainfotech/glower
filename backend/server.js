const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
require("dotenv").config();
const authMiddleware = require("./middleware/authMiddleware");
const cartRoutes = require("./routes/cartRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "glower1",
});

// Check Database Connection
db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

// JWT Secret Key
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "2h" });
};

// Fetch All Users (Admin Only)
app.get("/admin/users",  (req, res) => {
  db.query("SELECT id, username, email FROM users", (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.status(200).json(results);
  });
});

// User Signup
app.post("/auth/signup", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  db.query(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, hashedPassword],
    (err) => {
      if (err) {
        console.error("Error during signup:", err);
        return res.status(500).json({ error: "Error creating user." });
      }
      res.status(201).json({ message: "User registered successfully." });
    }
  );
});

// User Login
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (results.length === 0) {
      return res.status(400).json({ error: "Invalid credentials." });
    }
    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials." });
    }
    const token = generateToken(user);
    res.status(200).json({ token, user: { id: user.id, username: user.username, email: user.email } });
  });
});

// Protected Route Example
app.get("/profile", authMiddleware.authenticateToken, (req, res) => {
  res.json({ message: "Welcome to your profile.", user: req.user });
});

// Mounting cart routes correctly
app.use("/api/cart", cartRoutes);

// Order API Endpoint
app.post("/api/orders", authMiddleware.authenticateToken, (req, res) => {
  const { firstName, lastName, email, mobile, pincode, state, city, addressLine1, addressLine2, paymentMethod, cart, totalPrice } = req.body;

  if (!cart || !cart.length) {
    return res.status(400).json({ message: "Cart is empty." });
  }

  const userId = req.user.id;
  const orderQuery = `
    INSERT INTO orders (user_id, first_name, last_name, email, mobile, pincode, state, city, address_line1, address_line2, payment_method, total_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    orderQuery,
    [userId, firstName, lastName, email, mobile, pincode, state, city, addressLine1, addressLine2, paymentMethod, totalPrice],
    (err, result) => {
      if (err) {
        console.error("Error saving order:", err);
        return res.status(500).json({ message: "Failed to save the order." });
      }

      const orderId = result.insertId;

      const orderItemsData = cart.map((item) => {
        if (!item.name) {
          console.error("Error: Missing name for item", item);
          return null;
        }
        return [orderId, item.name, item.quantity, item.price];
      }).filter(item => item !== null);

      if (orderItemsData.length === 0) {
        return res.status(400).json({ message: "All items in the cart are missing names." });
      }

      const orderItemsQuery = `
        INSERT INTO order_items (order_id, product_name, quantity, price)
        VALUES ?
      `;

      db.query(orderItemsQuery, [orderItemsData], (err) => {
        if (err) {
          console.error("Error saving order items:", err);
          return res.status(500).json({ message: "Failed to save order items." });
        }
        res.status(201).json({ message: "Order placed successfully." });
      });
    }
  );
});

// Contact Form API - Save Form Data to MySQL
app.post("/api/contact", (req, res) => {
  const { fullName, email, mobile, message } = req.body;

  if (!fullName || !email || !mobile || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const query = `
    INSERT INTO contacts (full_name, email, mobile, message, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;

  db.query(query, [fullName, email, mobile, message], (err) => {
    if (err) {
      console.error("Error saving contact form data:", err);
      return res.status(500).json({ message: "Failed to save contact form data." });
    }
    res.status(201).json({ message: "Message received successfully!" });
  });
});

// Fetch All Contact Form Data
app.get("/admin/contacts", (req, res) => {
  const query = "SELECT * FROM contacts ORDER BY created_at DESC";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching contacts:", err);
      return res.status(500).json({ message: "Failed to fetch contacts." });
    }
    res.status(200).json(results);
  });
});

// Delete Contact Form Entry
app.delete("/admin/contacts/:id", (req, res) => {
  const contactId = req.params.id;

  const query = "DELETE FROM contacts WHERE id = ?";

  db.query(query, [contactId], (err) => {
    if (err) {
      console.error("Error deleting contact:", err);
      return res.status(500).json({ message: "Failed to delete contact." });
    }
    res.status(200).json({ message: "Contact deleted successfully." });
  });
});



app.get("/admin/orders", (req, res) => {
  const sql = `
    SELECT o.id, o.user_id, u.username, o.first_name, o.last_name, o.email, 
           o.mobile, o.pincode, o.state, o.city, o.address_line1, o.address_line2, 
           o.payment_method, o.total_price, o.created_at, 
           oi.product_name, oi.quantity
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN order_items oi ON o.id = oi.order_id
    ORDER BY o.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching orders:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.status(200).json(results);
  });
});

// Accept Order (Generate Bill & Save to Accepted Orders)
app.put("/admin/orders/:id/accept", (req, res) => {
  const orderId = req.params.id;

  const sql = `
    SELECT o.id, o.first_name, o.last_name, o.email, oi.product_name, oi.quantity, 
           o.total_price, o.payment_method, o.created_at
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = ?
  `;

  db.query(sql, [orderId], (err, results) => {
    if (err) {
      console.error("Error fetching order details:", err);
      return res.status(500).json({ error: "Failed to fetch order details." });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    const bill = {
      orderId: results[0].id,
      customerName: `${results[0].first_name} ${results[0].last_name}`,
      email: results[0].email,
      products: results.map((item) => ({
        productName: item.product_name,
        quantity: item.quantity,
      })),
      totalPrice: results[0].total_price,
      tax: (results[0].total_price * 0.05).toFixed(2),
      finalPrice: (results[0].total_price * 1.05).toFixed(2),
      paymentMethod: results[0].payment_method,
      date: results[0].created_at,
    };

    const insertBillSql = `INSERT INTO accepted_orders (order_id, customer_name, email, total_price, tax, final_price, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(
      insertBillSql,
      [bill.orderId, bill.customerName, bill.email, bill.totalPrice, bill.tax, bill.finalPrice, bill.paymentMethod, bill.date],
      (err) => {
        if (err) {
          console.error("Error saving accepted order:", err);
          return res.status(500).json({ error: "Failed to save accepted order." });
        }
        res.status(200).json({ message: "Order accepted and bill generated.", bill });
      }
    );
  });
});

// Fetch Accepted Orders
app.get("/admin/accepted-orders", (req, res) => {
  const sql = "SELECT * FROM accepted_orders ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching accepted orders:", err);
      return res.status(500).json({ error: "Failed to fetch accepted orders." });
    }
    res.status(200).json(results);
  });
});

// Reject Order (Delete from Database)
app.delete("/admin/orders/:id/reject", (req, res) => {
  const orderId = req.params.id;

  const deleteOrderItemsSql = "DELETE FROM order_items WHERE order_id = ?";
  const deleteOrderSql = "DELETE FROM orders WHERE id = ?";

  db.query(deleteOrderItemsSql, [orderId], (err) => {
    if (err) {
      console.error("Error deleting order items:", err);
      return res.status(500).json({ error: "Failed to delete order items." });
    }

    db.query(deleteOrderSql, [orderId], (err) => {
      if (err) {
        console.error("Error deleting order:", err);
        return res.status(500).json({ error: "Failed to delete order." });
      }
      res.status(200).json({ message: "Order rejected and deleted successfully." });
    });
  });
}); 



// Update User API (Admin Only)
app.put("/admin/users/:id", (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: "Username and email are required." });
  }

  const query = "UPDATE users SET username = ?, email = ? WHERE id = ?";
  db.query(query, [username, email, id], (err, result) => {
    if (err) {
      console.error("Error updating user:", err);
      return res.status(500).json({ error: "Failed to update user." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ message: "User updated successfully." });
  });
});

// Delete User API (Admin Only)
app.delete("/admin/users/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM users WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error deleting user:", err);
      return res.status(500).json({ error: "Failed to delete user." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ message: "User deleted successfully." });
  });
});


// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
