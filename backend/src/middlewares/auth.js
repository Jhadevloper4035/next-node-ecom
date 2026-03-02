const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { verifyAccessToken } = require("../config/token");
const User = require("../models/user.model");

module.exports = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) throw new ApiError(401, "Unauthorized");
  const token = header.slice(7);

  let decoded;
  try { decoded = verifyAccessToken(token); }
  catch { throw new ApiError(401, "Unauthorized"); }

  const user = await User.findById(decoded.sub).select("-password -emailOtpHash -refreshTokens.tokenHash");
  if (!user) throw new ApiError(401, "Unauthorized");
  if (user.isBlocked) throw new ApiError(403, "Account blocked");

  req.user = { id: user._id.toString(), role: user.role };
  req.userDoc = user;
  next();
});
