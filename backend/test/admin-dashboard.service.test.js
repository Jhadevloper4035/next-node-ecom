process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";

const assert = require("node:assert/strict");
const test = require("node:test");
const Order = require("../src/models/order.model");
const User = require("../src/models/user.model");
const { getAdminDashboard } = require("../src/services/admin-dashboard.service");

test("admin dashboard fills missing months and reports persisted totals", async () => {
  const aggregate = Order.aggregate;
  const countDocuments = User.countDocuments;
  Order.aggregate = async () => [{
    summary: [{ totalOrders: 12, pendingPayments: 2, toFulfil: 3, collectedPaise: 450000, refundedPaise: 5000 }],
    status: [{ _id: "confirmed", count: 3 }],
    trend: [{ _id: "2026-08", orders: 4, collectedPaise: 200000 }],
  }];
  User.countDocuments = async () => 8;

  try {
    const dashboard = await getAdminDashboard(new Date("2026-08-21T00:00:00.000Z"));
    assert.deepEqual(dashboard.metrics, { totalOrders: 12, customers: 8, collectedPaise: 450000, pendingPayments: 2, toFulfil: 3, refundedPaise: 5000 });
    assert.equal(dashboard.trend.length, 6);
    assert.deepEqual(dashboard.trend.at(-1), { month: "Aug", orders: 4, collectedPaise: 200000 });
    assert.deepEqual(dashboard.status, [{ _id: "confirmed", count: 3 }]);
  } finally {
    Order.aggregate = aggregate;
    User.countDocuments = countDocuments;
  }
});
