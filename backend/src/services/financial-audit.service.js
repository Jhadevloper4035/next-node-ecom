const FinancialAuditLog = require("../models/financialAuditLog.model");

async function recordFinancialAudit({ actor = null, actorType = "system", order, paymentTransaction = null, refund = null, action, previousState = {}, newState = {}, correlationId = "", paymentId = "", details = {}, session }) {
  const isObjectId = FinancialAuditLog.base.isValidObjectId;
  if (!isObjectId(order)) return null;
  if (actor && !isObjectId(actor)) actor = null;
  if (paymentTransaction && !isObjectId(paymentTransaction)) paymentTransaction = null;
  if (refund && !isObjectId(refund)) refund = null;
  const values = { actor, actorType, order, paymentTransaction, refund, action, previousState, newState, correlationId, paymentId, details };
  if (!session) return FinancialAuditLog.create(values);
  const [audit] = await FinancialAuditLog.create([values], { session });
  return audit;
}

module.exports = { recordFinancialAudit };
