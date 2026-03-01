const mongoose     = require("mongoose");
const ApiResponse  = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const health = asyncHandler(async (req, res) => {
  const up = mongoose.connection.readyState === 1;
  return res.status(up ? 200 : 503).json(new ApiResponse({
    message: "OK",
    data: { status: up ? "up" : "degraded", db: up ? "connected" : "disconnected", timestamp: new Date().toISOString() },
  }));
});

module.exports = { health };
