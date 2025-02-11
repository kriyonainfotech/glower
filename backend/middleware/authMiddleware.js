const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// Middleware to authenticate JWT token
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[WARN] Missing or malformed authorization header.");
    return res.status(403).json({ error: "Authorization token is required." });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.error("[ERROR] Invalid or expired token:", err.message);
      return res.status(401).json({ error: "Invalid or expired token." });
    }
    req.user = decoded; // Attach decoded user information to the request
    console.info("[INFO] Token successfully verified for user:", decoded);
    next();
  });
};

// Middleware to authorize Admin access
exports.authorizeAdmin = (req, res, next) => {
  console.info("[INFO] Public access granted to all users, including admins.");
  next();
};

// Enhanced logging for debugging
exports.debugMiddleware = (req, res, next) => {
  console.log("[DEBUG] Request Path:", req.path);
  console.log("[DEBUG] Request Method:", req.method);
  console.log("[DEBUG] Request Headers:", req.headers);
  console.log("[DEBUG] Request User:", req.user || "No User");
  console.log("[DEBUG] Request Body:", req.body);
  next();
};
