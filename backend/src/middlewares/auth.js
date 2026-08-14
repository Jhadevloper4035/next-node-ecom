const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { verifyAccessToken } = require("../config/token");
const { env } = require("../config/env");
const User = require("../models/user.model");

module.exports = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.cookies?.[env.accessCookieName];
  if (!token) throw new ApiError(401, "Unauthorized");

  let decoded;
  try { decoded = verifyAccessToken(token); }
  catch { throw new ApiError(401, "Unauthorized"); }
  if (decoded.type !== "access") throw new ApiError(401, "Unauthorized");

  const user = await User.findById(decoded.sub).select("-password");
  if (!user) throw new ApiError(401, "Unauthorized");
  if (user.isBlocked) throw new ApiError(403, "Account blocked");
  if (decoded.tokenVersion !== user.tokenVersion) throw new ApiError(401, "Unauthorized");

  req.user = { id: user._id.toString(), role: user.role };
  req.userDoc = user;
  next();
});
