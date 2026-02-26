const ApiResponse  = require("../utils/ApiResponse");
const ApiError     = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const User         = require("../models/User");
const { toSafeUser } = require("../utils/safeUser");

const getProfile = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse({ message: "OK", data: { user: toSafeUser(req.userDoc) } }));
});

const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.fullName     !== undefined) updates.fullName     = req.body.fullName;
  if (req.body.mobileNumber !== undefined) updates.mobileNumber = req.body.mobileNumber;

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json(new ApiResponse({ message: "Profile updated", data: { user: toSafeUser(user) } }));
});

module.exports = { getProfile, updateProfile };
