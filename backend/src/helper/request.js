

// helpers
const sendSuccess = (res, data, message = "Success", statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const sendError = (res, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, message });

const isDuplicateErr = (err) =>
  err?.code === 11000 || String(err?.message || "").toLowerCase().includes("already exists");


module.exports = {sendSuccess , sendError , isDuplicateErr }