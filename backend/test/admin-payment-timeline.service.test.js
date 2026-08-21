process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const Order = require("../src/models/order.model");
const PaymentTransaction = require("../src/models/paymentTransaction.model");
const PaymentWebhookEvent = require("../src/models/paymentWebhookEvent.model");
const PaymentReconciliationAction = require("../src/models/paymentReconciliationAction.model");
const Refund = require("../src/models/refund.model");
const EmailEvent = require("../src/models/emailEvent.model");
const FinancialAuditLog = require("../src/models/financialAuditLog.model");
const { getAdminPaymentTimeline, reservationStatus } = require("../src/services/admin-payment-timeline.service");

test("admin payment timeline combines the order history without raw webhook data", async () => {
  const originals = {
    findOrder: Order.findOne, findPaymentById: PaymentTransaction.findById, findPayment: PaymentTransaction.find,
    findWebhook: PaymentWebhookEvent.find, findReconciliation: PaymentReconciliationAction.find, findRefund: Refund.find,
    findEmail: EmailEvent.find, findAudit: FinancialAuditLog.find,
  };
  const order = { _id: "order-1", orderNumber: "CC123", status: "confirmed", paymentStatus: "paid", paymentMethod: "upi", pricing: { totalPaise: 10_000 }, expiresAt: new Date("2026-08-21T12:00:00.000Z"), createdAt: new Date("2026-08-21T10:00:00.000Z"), items: [{ title: "Chair", quantity: 1 }] };
  const attempt = { attemptNumber: 1, gateway: "cashfree", status: "paid", cashfreeStatus: "SUCCESS", cfOrderId: "cf-order", cfPaymentId: "cf-payment", amountPaise: 10_000, currency: "INR", createdAt: new Date("2026-08-21T10:01:00.000Z") };
  Order.findOne = async () => order;
  PaymentTransaction.find = async () => [attempt];
  PaymentWebhookEvent.find = async () => [{ eventType: "PAYMENT_SUCCESS_WEBHOOK", cfPaymentId: "cf-payment", cfOrderId: "cf-order", signatureValid: true, status: "processed", processingError: "", duplicateCount: 0, receivedAt: new Date("2026-08-21T10:02:00.000Z"), rawPayload: "secret" }];
  PaymentReconciliationAction.find = async () => [{ type: "confirmed", cfPaymentId: "cf-payment", details: {}, createdAt: new Date("2026-08-21T10:03:00.000Z") }];
  Refund.find = async () => [{ refundId: "RF1", amountPaise: 100, reason: "Customer request", status: "pending", cashfreeStatus: "PENDING", createdAt: new Date("2026-08-21T10:04:00.000Z") }];
  EmailEvent.find = async () => [{ _id: "email-1", type: "orderConfirmed", to: "customer@example.com", status: "sent", attemptCount: 1, manualResendCount: 0, createdAt: new Date("2026-08-21T10:05:00.000Z") }];
  FinancialAuditLog.find = async () => [{ action: "payment_status_updated", actorType: "cashfree_webhook", paymentId: "cf-payment", previousState: { status: "pending" }, newState: { status: "paid" }, details: {}, createdAt: new Date("2026-08-21T10:06:00.000Z") }];
  try {
    const timeline = await getAdminPaymentTimeline("CC123");
    assert.equal(timeline.order.orderNumber, "CC123");
    assert.equal(timeline.attempts[0].cfOrderId, "cf-order");
    assert.equal(timeline.webhooks[0].rawPayload, undefined);
    assert.equal(timeline.stockReservation.status, "consumed");
    assert.deepEqual(timeline.timeline.map((event) => event.type), ["payment_attempt", "webhook", "reconciliation", "refund", "email", "audit"]);
  } finally {
    Order.findOne = originals.findOrder;
    PaymentTransaction.findById = originals.findPaymentById;
    PaymentTransaction.find = originals.findPayment;
    PaymentWebhookEvent.find = originals.findWebhook;
    PaymentReconciliationAction.find = originals.findReconciliation;
    Refund.find = originals.findRefund;
    EmailEvent.find = originals.findEmail;
    FinancialAuditLog.find = originals.findAudit;
  }
});

test("stock reservations remain held only while checkout is pending", () => {
  assert.equal(reservationStatus({ status: "pending_payment" }), "held");
  assert.equal(reservationStatus({ status: "cancelled" }), "released");
});

test("Cashfree payment and order IDs locate the same admin timeline", async () => {
  const originals = {
    findOrder: Order.findOne, findOrderById: Order.findById, findPayment: PaymentTransaction.findOne,
    findAttempts: PaymentTransaction.find, findWebhook: PaymentWebhookEvent.find, findReconciliation: PaymentReconciliationAction.find,
    findRefund: Refund.find, findEmail: EmailEvent.find, findAudit: FinancialAuditLog.find,
  };
  const order = { _id: "order-1", orderNumber: "CC123", status: "confirmed", paymentStatus: "paid", paymentMethod: "upi", pricing: {}, expiresAt: null, items: [] };
  let paymentSearch;
  Order.findOne = async () => null;
  Order.findById = async () => order;
  PaymentTransaction.findOne = async (filter) => { paymentSearch = filter; return { order: "order-1" }; };
  PaymentTransaction.find = async () => [];
  PaymentWebhookEvent.find = async () => [];
  PaymentReconciliationAction.find = async () => [];
  Refund.find = async () => [];
  EmailEvent.find = async () => [];
  FinancialAuditLog.find = async () => [];
  try {
    assert.equal((await getAdminPaymentTimeline("cf-payment")).order.orderNumber, "CC123");
    assert.deepEqual(paymentSearch, { $or: [{ cfPaymentId: "cf-payment" }, { cfOrderId: "cf-payment" }] });
  } finally {
    Order.findOne = originals.findOrder;
    Order.findById = originals.findOrderById;
    PaymentTransaction.findOne = originals.findPayment;
    PaymentTransaction.find = originals.findAttempts;
    PaymentWebhookEvent.find = originals.findWebhook;
    PaymentReconciliationAction.find = originals.findReconciliation;
    Refund.find = originals.findRefund;
    EmailEvent.find = originals.findEmail;
    FinancialAuditLog.find = originals.findAudit;
  }
});
