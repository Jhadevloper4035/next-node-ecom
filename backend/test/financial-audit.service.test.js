process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const FinancialAuditLog = require("../src/models/financialAuditLog.model");
const { recordFinancialAudit } = require("../src/services/financial-audit.service");

test("financial audit records the actor, correlation, payment, and state transition", async () => {
  const originalCreate = FinancialAuditLog.create;
  let values;
  FinancialAuditLog.create = async (nextValues) => { values = nextValues; return nextValues; };
  try {
    await recordFinancialAudit({ actor: "64eaf61043b6f85db67b6611", actorType: "admin", order: "64eaf61043b6f85db67b6612", paymentTransaction: "64eaf61043b6f85db67b6613", action: "payment_status_updated", previousState: { status: "pending" }, newState: { status: "paid" }, correlationId: "webhook-1", paymentId: "cf-payment-1" });
    assert.deepEqual(values, { actor: "64eaf61043b6f85db67b6611", actorType: "admin", order: "64eaf61043b6f85db67b6612", paymentTransaction: "64eaf61043b6f85db67b6613", refund: null, action: "payment_status_updated", previousState: { status: "pending" }, newState: { status: "paid" }, correlationId: "webhook-1", paymentId: "cf-payment-1", details: {} });
  } finally {
    FinancialAuditLog.create = originalCreate;
  }
});

test("financial audit uses Mongoose's array form when a session is supplied", async () => {
  const originalCreate = FinancialAuditLog.create;
  const session = {};
  let values;
  let options;
  FinancialAuditLog.create = async (nextValues, nextOptions) => {
    values = nextValues;
    options = nextOptions;
    return nextValues;
  };
  try {
    await recordFinancialAudit({ order: "64eaf61043b6f85db67b6612", action: "order_status_updated", session });
    assert.equal(values.length, 1);
    assert.equal(values[0].order, "64eaf61043b6f85db67b6612");
    assert.equal(values[0].action, "order_status_updated");
    assert.deepEqual(options, { session });
  } finally {
    FinancialAuditLog.create = originalCreate;
  }
});
