const ApiResponse  = require("../utils/ApiResponse");
const ApiError     = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const User         = require("../models/User");
const { toSafeUser } = require("../utils/safeUser");

const listUsers = asyncHandler(async (req, res) => {
  const page  = req.query.page  || 1;
  const limit = req.query.limit || 20;
  const skip  = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  return res.status(200).json(new ApiResponse({
    message: "OK",
    data: { users: users.map(toSafeUser), pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  }));
});

const updateUserRole = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw new ApiError(400, "You cannot change your own role");
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  user.role = req.body.role;
  await user.save();
  return res.status(200).json(new ApiResponse({ message: "Role updated", data: { user: toSafeUser(user) } }));
});

const blockUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw new ApiError(400, "You cannot block your own account");
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  user.isBlocked = req.body.isBlocked;
  if (req.body.isBlocked) user.refreshTokens = [];
  await user.save();
  return res.status(200).json(new ApiResponse({ message: req.body.isBlocked ? "User blocked" : "User unblocked", data: { user: toSafeUser(user) } }));
});

module.exports = { listUsers, updateUserRole, blockUser };
