process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const Order = require("../src/models/order.model");
const FinancialAuditLog = require("../src/models/financialAuditLog.model");
const OutboxEvent = require("../src/models/outboxEvent.model");
const controller = require("../src/controllers/order.controller");

test("only an admin COD collection action can complete a balance-due delivery", async () => {
  const originalFindOne = Order.findOne;
  const originalFindOneAndUpdate = Order.findOneAndUpdate;
  const originalAuditCreate = FinancialAuditLog.create;
  const order = { _id: "order-id", orderNumber: "CC123", status: "shipped", paymentMethod: "cod", paymentStatus: "advance_paid", codBalanceStatus: "due", codBalanceDuePaise: 6_000 };
  let update;
  Order.findOne = async () => order;
  Order.findOneAndUpdate = async (_filter, nextUpdate) => {
    update = nextUpdate;
    return { ...order, ...nextUpdate.$set };
  };
  FinancialAuditLog.create = async () => ({});
  try {
    let response;
    await controller.updateOrderStatus(
      { params: { orderId: "CC123" }, body: { status: "delivered", codBalanceAction: "collected" }, user: { id: "admin-id" } },
      { json: (value) => { response = value; } },
      (error) => { throw error; },
    );
    assert.equal(response.data.order.paymentStatus, "paid");
    assert.equal(update.$set.codBalanceStatus, "collected");
    assert.equal(update.$set.codBalanceConfirmedBy, "admin-id");
    assert.ok(update.$set.codBalanceCollectedAt instanceof Date);
  } finally {
    Order.findOne = originalFindOne;
    Order.findOneAndUpdate = originalFindOneAndUpdate;
    FinancialAuditLog.create = originalAuditCreate;
  }
});

test("COD delivery cannot be completed before its balance is recorded", async () => {
  const originalFindOne = Order.findOne;
  const order = { _id: "order-id", orderNumber: "CC123", status: "shipped", paymentMethod: "cod", paymentStatus: "advance_paid", codBalanceStatus: "due", codBalanceDuePaise: 6_000 };
  Order.findOne = async () => order;
  try {
    let error;
    await controller.updateOrderStatus(
      { params: { orderId: "CC123" }, body: { status: "delivered" } },
      {},
      (nextError) => { error = nextError; },
    );
    assert.equal(error?.statusCode, 409);
  } finally {
    Order.findOne = originalFindOne;
  }
});

test("a paid cancellation becomes a cancellation request and keeps its payment state", async () => {
  const originalFindOne = Order.findOne;
  const originalFindOneAndUpdate = Order.findOneAndUpdate;
  const originalAuditCreate = FinancialAuditLog.create;
  const order = { _id: "order-id", orderNumber: "CC123", status: "confirmed", paymentMethod: "upi", paymentStatus: "paid" };
  let update;
  Order.findOne = async () => order;
  Order.findOneAndUpdate = async (_filter, nextUpdate) => {
    update = nextUpdate;
    return { ...order, ...nextUpdate.$set };
  };
  FinancialAuditLog.create = async () => ({});
  try {
    let response;
    await controller.updateOrderStatus(
      { params: { orderId: "CC123" }, body: { status: "cancelled" }, user: { id: "admin-id" } },
      { json: (value) => { response = value; } },
      (error) => { throw error; },
    );
    assert.equal(response.message, "Cancellation requested");
    assert.equal(update.$set.status, "cancel_requested");
    assert.equal(response.data.order.paymentStatus, "paid");
  } finally {
    Order.findOne = originalFindOne;
    Order.findOneAndUpdate = originalFindOneAndUpdate;
    FinancialAuditLog.create = originalAuditCreate;
  }
});

test("confirming an order through the status workflow queues its confirmation email", async () => {
  const originalFindOne = Order.findOne;
  const originalFindOneAndUpdate = Order.findOneAndUpdate;
  const originalAuditCreate = FinancialAuditLog.create;
  const originalOutboxUpdateOne = OutboxEvent.updateOne;
  const order = { _id: "order-id", orderNumber: "CC123", status: "payment_review_required", paymentTransaction: "payment-id" };
  let outbox;
  Order.findOne = async () => order;
  Order.findOneAndUpdate = async (_filter, update) => ({ ...order, ...update.$set });
  FinancialAuditLog.create = async () => ({});
  OutboxEvent.updateOne = async (filter, update) => { outbox = { filter, event: update.$setOnInsert }; };
  try {
    await controller.updateOrderStatus(
      { params: { orderId: "CC123" }, body: { status: "confirmed" }, user: { id: "admin-id" } },
      { json: () => {} },
      (error) => { throw error; },
    );
    assert.deepEqual(outbox, {
      filter: { dedupeKey: "ORDER_CONFIRMED:order-id" },
      event: { type: "ORDER_CONFIRMED", order: "order-id", paymentTransaction: "payment-id", refund: null, dedupeKey: "ORDER_CONFIRMED:order-id" },
    });
  } finally {
    Order.findOne = originalFindOne;
    Order.findOneAndUpdate = originalFindOneAndUpdate;
    FinancialAuditLog.create = originalAuditCreate;
    OutboxEvent.updateOne = originalOutboxUpdateOne;
  }
});

test("customer order reads remain scoped to the authenticated user", async () => {
  const originalFindOne = Order.findOne;
  let filter;
  Order.findOne = (nextFilter) => {
    filter = nextFilter;
    return { populate: async () => null };
  };
  try {
    let error;
    await controller.getMyOrder(
      { params: { orderId: "CC123" }, user: { id: "customer-a" } },
      {},
      (nextError) => { error = nextError; },
    );
    assert.deepEqual(filter, { orderNumber: "CC123", user: "customer-a" });
    assert.equal(error?.statusCode, 404);
  } finally {
    Order.findOne = originalFindOne;
  }
});

test("pending order reads load the payment fields needed for Cashfree reconciliation", async () => {
  const originalFindOne = Order.findOne;
  let populatedFields;
  Order.findOne = () => ({
    populate: async (fields) => {
      populatedFields = fields;
      return { _id: "order-id", orderNumber: "CC123", status: "confirmed" };
    },
  });
  try {
    await controller.getMyOrder(
      { params: { orderId: "CC123" }, user: { id: "customer-a" } },
      { json: () => {} },
      (error) => { throw error; },
    );
    assert.ok(populatedFields.every((field) => field.select.includes("gateway") && field.select.includes("cfOrderId")));
  } finally {
    Order.findOne = originalFindOne;
  }
});
