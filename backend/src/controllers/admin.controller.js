const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user.model");
const Session = require("../models/session.model");
const { toSafeUser } = require("../utils/safeUser");
const { getMonitoringSnapshot } = require("../services/monitoring.service");
const { getAdminPaymentTimeline } = require("../services/admin-payment-timeline.service");
const { getAdminDashboard } = require("../services/admin-dashboard.service");
const Order = require("../models/order.model");
const { reconcileActiveCheckout } = require("../services/checkout.service");
const { recordFinancialAudit } = require("../services/financial-audit.service");


exports.listUsers = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 20;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  return res.status(200).json(new ApiResponse({
    message: "OK",
    data: { users: users.map(toSafeUser), pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  }));
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw new ApiError(400, "You cannot change your own role");
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  user.role = req.body.role;
  await user.save();
  return res.status(200).json(new ApiResponse({ message: "Role updated", data: { user: toSafeUser(user) } }));
});



exports.blockUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw new ApiError(400, "You cannot block your own account");
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  user.isBlocked = req.body.isBlocked;
  await user.save();
  if (req.body.isBlocked) await Session.updateMany({ userId: user._id, isRevoked: false }, { $set: { isRevoked: true, revokedAt: new Date() } });
  return res.status(200).json(new ApiResponse({ message: req.body.isBlocked ? "User blocked" : "User unblocked", data: { user: toSafeUser(user) } }));
});

exports.monitoring = asyncHandler(async (req, res) => {
  const monitoring = await getMonitoringSnapshot();
  return res.status(200).json(new ApiResponse({ message: "OK", data: { monitoring } }));
});

exports.dashboard = asyncHandler(async (req, res) => {
  const dashboard = await getAdminDashboard();
  return res.status(200).json(new ApiResponse({ message: "OK", data: { dashboard } }));
});

exports.paymentTimeline = asyncHandler(async (req, res) => {
  const timeline = await getAdminPaymentTimeline(req.query.q.trim());
  return res.status(200).json(new ApiResponse({ message: "OK", data: { timeline } }));
});

exports.reconcilePayment = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderId }).populate(["activePaymentTransaction", "paymentTransaction"]);
  if (!order) throw new ApiError(404, "Order not found");
  const previousState = { status: order.status, paymentStatus: order.paymentStatus };
  try {
    const result = await reconcileActiveCheckout(order);
    const currentOrder = result.order || order;
    await recordFinancialAudit({ actor: req.user.id, actorType: "admin", order: currentOrder._id, paymentTransaction: currentOrder.paymentTransaction, action: "payment_reconciled", previousState, newState: { status: currentOrder.status, paymentStatus: currentOrder.paymentStatus }, correlationId: `ADMIN_RECONCILIATION:${req.user.id}:${currentOrder._id}`, details: { reason: req.body.reason, outcome: result.result?.outcome || "no_change" } });
    return res.status(200).json(new ApiResponse({ message: "Payment reconciled", data: { order: currentOrder, paymentPending: result.paymentPending || false } }));
  } catch (error) {
    await recordFinancialAudit({ actor: req.user.id, actorType: "admin", order: order._id, paymentTransaction: order.paymentTransaction, action: "payment_reconciliation_failed", previousState, newState: previousState, correlationId: `ADMIN_RECONCILIATION:${req.user.id}:${order._id}`, details: { reason: req.body.reason } });
    throw error;
  }
});
