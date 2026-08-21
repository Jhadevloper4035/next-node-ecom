function paymentAmountPaise(value) {
  if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") return null;
  const paise = Number(value) * 100;
  const roundedPaise = Math.round(paise);
  if (!Number.isSafeInteger(roundedPaise) || paise < 0 || Math.abs(paise - roundedPaise) > 0.000001) return null;
  return roundedPaise;
}

function paymentVerificationError({ order, attempt, payment, merchantOrderId, cashfreeOrderId }) {
  if (String(merchantOrderId || "") !== String(order.orderNumber)) return "Payment order mismatch";
  if (!payment?.cf_payment_id) return "Payment ID is missing";
  if (String(payment.payment_currency || "") !== attempt.currency || attempt.currency !== order.pricing.currency) return "Payment currency mismatch";
  if (cashfreeOrderId && String(cashfreeOrderId) !== String(attempt.cfOrderId)) return "Cashfree order mismatch";

  const amountPaise = paymentAmountPaise(payment.payment_amount);
  if (amountPaise === null) return "Payment amount is invalid";
  if (amountPaise !== attempt.amountPaise) return "Payment amount mismatch";
  return null;
}

module.exports = { paymentAmountPaise, paymentVerificationError };
