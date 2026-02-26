const ApiError = require("../utils/ApiError");

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return next(new ApiError(403, "Forbidden"));
    next();
  };
}

module.exports = requireRole;
