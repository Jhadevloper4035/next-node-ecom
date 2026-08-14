const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

module.exports = (origins) => {
  const allowedOrigins = new Set((Array.isArray(origins) ? origins : [origins]).filter(Boolean));
  return (req, res, next) => {
    if (!UNSAFE_METHODS.has(req.method) || allowedOrigins.has(req.get("origin"))) return next();
  return res.status(403).json({ success: false, message: "Cross-origin request blocked" });
  };
};
