const ApiResponse = require("../utils/ApiResponse");
const { env } = require("../config/env");

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.statusCode || 500;
  if (status >= 500) console.error(`[${req.method} ${req.originalUrl}]`, err.message);
  res.status(status).json(new ApiResponse({
    success: false,
    message: err.message || "Internal Server Error",
    data: { errors: err.errors || null, ...(env.nodeEnv === "development" && { stack: err.stack }) },
  }));
}

module.exports = errorHandler;
