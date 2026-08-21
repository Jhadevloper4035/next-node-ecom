const Order = require("../models/order.model");
const User = require("../models/user.model");

function monthRange(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

function dashboardMonth(month) {
  return new Date(`${month}-01T00:00:00.000Z`).toLocaleDateString("en-IN", { month: "short" });
}

async function getAdminDashboard(now = new Date()) {
  const { start, end } = monthRange(now);
  const [data, customers] = await Promise.all([
    Order.aggregate([
      {
        $facet: {
          summary: [{
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              pendingPayments: { $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] } },
              toFulfil: { $sum: { $cond: [{ $in: ["$status", ["confirmed", "processing"]] }, 1, 0] } },
              collectedPaise: { $sum: { $subtract: [{ $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$pricing.totalPaise", "$advancePaidPaise"] }, "$refundedPaise"] } },
              refundedPaise: { $sum: "$refundedPaise" },
            },
          }],
          status: [{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
          trend: [
            { $match: { createdAt: { $gte: start, $lt: end } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } }, orders: { $sum: 1 }, collectedPaise: { $sum: { $subtract: [{ $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$pricing.totalPaise", "$advancePaidPaise"] }, "$refundedPaise"] } } } },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]),
    User.countDocuments({ role: "user" }),
  ]);

  const summary = data[0]?.summary[0] || {};
  const trends = new Map((data[0]?.trend || []).map((item) => [item._id, item]));
  const trend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
    const key = date.toISOString().slice(0, 7);
    const item = trends.get(key) || {};
    return { month: dashboardMonth(key), orders: item.orders || 0, collectedPaise: item.collectedPaise || 0 };
  });

  return {
    generatedAt: now.toISOString(),
    metrics: {
      totalOrders: summary.totalOrders || 0,
      customers,
      collectedPaise: summary.collectedPaise || 0,
      pendingPayments: summary.pendingPayments || 0,
      toFulfil: summary.toFulfil || 0,
      refundedPaise: summary.refundedPaise || 0,
    },
    trend,
    status: data[0]?.status || [],
  };
}

module.exports = { getAdminDashboard, monthRange, dashboardMonth };
