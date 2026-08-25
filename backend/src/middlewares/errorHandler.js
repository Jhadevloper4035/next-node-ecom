const ApiResponse = require("../utils/ApiResponse");
const { env } = require("../config/env");
const logger = require("../config/logger");

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const isValidationError = err.name === "ValidationError";
  const isCastError = err.name === "CastError";
  const isInputError = isValidationError || isCastError;
  const status = err.statusCode || (isInputError ? 400 : 500);
  const message = isInputError || (status >= 500 && env.nodeEnv === "production")
    ? "Something went wrong. Please try again later."
    : err.message || "Internal Server Error";

  if (status >= 500) (req.log || logger).error({ err, event: "request_failed" }, "Request failed");
  res.status(status).json(new ApiResponse({
    success: false,
    message,
    data: { errors: isInputError ? null : err.errors || null, ...(env.nodeEnv === "development" && !isInputError && { stack: err.stack }) },
  }));
}

module.exports = errorHandler;
