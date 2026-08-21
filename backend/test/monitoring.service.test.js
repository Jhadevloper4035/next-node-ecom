process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const Order = require("../src/models/order.model");
const PaymentTransaction = require("../src/models/paymentTransaction.model");
const PaymentWebhookEvent = require("../src/models/paymentWebhookEvent.model");
const PaymentGatewayCall = require("../src/models/paymentGatewayCall.model");
const FinancialAuditLog = require("../src/models/financialAuditLog.model");
const Refund = require("../src/models/refund.model");
const EmailEvent = require("../src/models/emailEvent.model");
const eventQueue = require("../src/queues/event.queue");
const emailQueue = require("../src/queues/email.queue");
const { queueMetrics } = require("../src/services/monitoring.service");

test("monitoring reports a queue outage without exposing queue errors", async () => {
  const metrics = await queueMetrics(() => { throw new Error("redis password=secret"); });
  assert.deepEqual(metrics, { available: false, failed: 0, depth: 0 });
});

test("monitoring snapshot combines the persisted operational signals", async () => {
  const originals = new Map([
    [Order, { countDocuments: Order.countDocuments }],
    [PaymentTransaction, { countDocuments: PaymentTransaction.countDocuments, aggregate: PaymentTransaction.aggregate }],
    [PaymentWebhookEvent, { countDocuments: PaymentWebhookEvent.countDocuments, aggregate: PaymentWebhookEvent.aggregate }],
    [PaymentGatewayCall, { countDocuments: PaymentGatewayCall.countDocuments, aggregate: PaymentGatewayCall.aggregate }],
    [FinancialAuditLog, { countDocuments: FinancialAuditLog.countDocuments }],
    [Refund, { countDocuments: Refund.countDocuments }],
    [EmailEvent, { countDocuments: EmailEvent.countDocuments }],
  ]);
  const originalEventQueue = eventQueue.getEventQueue;
  const originalEmailQueue = emailQueue.getEmailQueue;

  PaymentTransaction.countDocuments = async ({ status }) => ({ paid: 8, failed: 2, pending: 3, user_dropped: 4 }[status] || 0);
  PaymentTransaction.aggregate = async () => [{ _id: "upi", count: 6 }, { _id: "card", count: 2 }];
  PaymentWebhookEvent.countDocuments = async (filter) => filter.signatureValid === false ? 5 : 6;
  PaymentWebhookEvent.aggregate = async () => [{ count: 7 }];
  PaymentGatewayCall.countDocuments = async () => 9;
  PaymentGatewayCall.aggregate = async () => [{ average: 123.6 }];
  FinancialAuditLog.countDocuments = async ({ "details.reason": reason, "newState.status": status }) => ({
    duplicate_payment: 10, amount_mismatch: 13, currency_mismatch: 14,
    late_payment: status === "payment_review_required" ? 11 : 12,
  }[reason] || 0);
  Refund.countDocuments = async ({ status }) => status.$in.includes("failed") ? 15 : 16;
  EmailEvent.countDocuments = async () => 17;
  Order.countDocuments = async () => 18;
  eventQueue.getEventQueue = () => ({ getJobCounts: async () => ({ waiting: 1, active: 2, delayed: 3, failed: 4 }) });
  emailQueue.getEmailQueue = () => ({ getJobCounts: async () => ({ waiting: 5, active: 6, delayed: 7, failed: 8 }) });

  delete require.cache[require.resolve("../src/services/monitoring.service")];
  const { getMonitoringSnapshot } = require("../src/services/monitoring.service");
  try {
    const snapshot = await getMonitoringSnapshot(new Date("2026-08-21T00:00:00.000Z"));
    assert.equal(snapshot.payments.successRate, 80);
    assert.equal(snapshot.payments.failureRate, 20);
    assert.deepEqual(snapshot.payments.successByMethod, { upi: 6, card: 2 });
    assert.equal(snapshot.webhooks.duplicates, 7);
    assert.equal(snapshot.cashfree.averageLatencyMs, 124);
    assert.deepEqual(snapshot.queues, { failedJobs: 12, depth: 24, events: { available: true, failed: 4, depth: 6 }, email: { available: true, failed: 8, depth: 18 } });
  } finally {
    for (const [model, methods] of originals) Object.assign(model, methods);
    eventQueue.getEventQueue = originalEventQueue;
    emailQueue.getEmailQueue = originalEmailQueue;
    delete require.cache[require.resolve("../src/services/monitoring.service")];
  }
});
