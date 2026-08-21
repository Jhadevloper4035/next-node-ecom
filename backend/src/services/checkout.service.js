const crypto = require("crypto");
const Address = require("../models/address.model");
const Order = require("../models/order.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const Product = require("../models/product.model");
const Coupon = require("../models/coupon.model");
const { env } = require("../config/env");
const { createCashfreeOrder, getCashfreePayments } = require("./payment.service");
const { activeCouponFilter, consumeCouponReservation, eligibleCouponItems, releaseCouponReservation, releaseCouponUse, reserveCoupon, reserveCouponForOrder, validateCoupon } = require("./coupon-lifecycle.service");
const { applyCashfreePaymentState, isUnconfirmedPaymentState, recordFailedPaymentEmail, resolveSuccessfulPayment } = require("./payment-state.service");
const { paymentVerificationError } = require("./payment-verification.service");
const { removePurchasedCartItems } = require("./cart.service");
const { recordOutboxEvent } = require("./outbox.service");
const { recordFinancialAudit } = require("./financial-audit.service");
const { withTransaction } = require("./transaction.service");
const ApiError = require("../utils/ApiError");

const toPaise = (amount) => Math.round(Number(amount) * 100);
const orderNumber = () => `CC${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
const paymentPlan = (totalPaise, paymentMethod) => paymentMethod === "cod"
  ? { advancePaise: Math.ceil(totalPaise / 3), balanceDuePaise: totalPaise - Math.ceil(totalPaise / 3), paymentMethods: "upi,cc,dc" }
  : { advancePaise: totalPaise, balanceDuePaise: 0, paymentMethods: "upi,cc,dc" };
const percentageDiscount = (subtotalPaise, discountPercent) => Math.floor(subtotalPaise * discountPercent / 100);

function checkoutIntent({ items, addressId, paymentMethod, couponCode }) {
  const cart = items
    .map((item) => ({
      productId: String(item.productId),
      quantity: Number(item.quantity),
      selectedOptions: (item.selectedOptions || []).map((option) => ({ key: String(option.key), value: String(option.value) })).sort((left, right) => `${left.key}:${left.value}`.localeCompare(`${right.key}:${right.value}`)),
    }))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  return {
    cartFingerprint: crypto.createHash("sha256").update(JSON.stringify(cart)).digest("hex"),
    address: String(addressId),
    paymentMethod,
    couponCode: String(couponCode || "").trim().toUpperCase(),
  };
}

function intentChanges(order, intent) {
  const stored = order.checkoutIntent;
  if (!stored?.cartFingerprint) return ["checkout details"];
  return [
    stored.cartFingerprint !== intent.cartFingerprint && "cart",
    String(stored.address || "") !== intent.address && "address",
    stored.paymentMethod !== intent.paymentMethod && "payment method",
    stored.couponCode !== intent.couponCode && "coupon",
  ].filter(Boolean);
}

function assertMatchingCheckoutIntent(order, intent) {
  const changes = intentChanges(order, intent);
  if (changes.length) throw new ApiError(409, `Active checkout has a different ${changes.join(", ")}. Cancel it before starting a new checkout.`);
}

async function getCoupon(code) {
  if (!code) return null;
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    ...activeCouponFilter(),
  }).lean();
  if (!coupon) throw new ApiError(400, "Coupon is invalid or expired");
  return coupon;
}

const optionPricingKeys = { sizes: "size", fabrics: "fabric-types", foams: "foam-density", materials: "material" };

const optionGroups = (product) => {
  const optionPricing = product.optionPricing || {};
  const hasOptionPricing = Object.values(optionPricing).some((options) => Array.isArray(options) && options.length);

  if (hasOptionPricing) {
    return Object.entries(optionPricing).map(([key, options]) => ({
      key: optionPricingKeys[key] || key.replace(/s$/, ""),
      label: key,
      options: (options || []).filter((option) => option.isActive !== false),
    }));
  }

  return (product.customizationGroups || [])
    .filter((group) => group.isActive !== false)
    .map((group) => ({ key: group.key, label: group.label, isRequired: group.isRequired === true, options: (group.options || []).filter((option) => option.isActive !== false) }));
};

function priceItem(product, selectedOptions = []) {
  let unitPricePaise = toPaise(product.basePrice);
  const snapshot = [];
  const seen = new Set();
  for (const selected of selectedOptions) {
    if (seen.has(selected.key)) throw new ApiError(400, "Duplicate product option");
    seen.add(selected.key);
    if (selected.key === "color") {
      if (!(product.tags || []).some((tag) => String(tag).toLowerCase() === `color:${String(selected.value).toLowerCase()}`)) throw new ApiError(400, "Invalid product option");
      snapshot.push({ key: "color", label: "Color", value: String(selected.value) });
      continue;
    }
    const group = optionGroups(product).find((item) => item.key === selected.key);
    const option = group?.options.find((item) => item.value === selected.value || item.label === selected.value);
    if (!option) throw new ApiError(400, "Invalid product option");
    const optionPrice = option.priceOverride === null || option.priceOverride === undefined ? toPaise(option.priceDelta || 0) : toPaise(option.priceOverride);
    unitPricePaise = option.priceOverride === null || option.priceOverride === undefined ? unitPricePaise + optionPrice : optionPrice;
    snapshot.push({ key: group.key, label: group.label, value: option.label });
  }
  for (const group of optionGroups(product)) {
    if (group.isRequired && !seen.has(group.key)) throw new ApiError(400, `Select ${group.label}`);
  }
  return { unitPricePaise, gstPercent: Number(product.gstPercent ?? 18), selectedOptions: snapshot };
}

function taxPaiseForItems(items, discountPaise = 0, coupon) {
  const eligibleItems = coupon ? new Set(eligibleCouponItems(coupon, items)) : new Set();
  let eligibleSubtotalPaise = [...eligibleItems].reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0);
  let remainingDiscountPaise = discountPaise;

  return items.reduce((taxPaise, item) => {
    const lineSubtotalPaise = item.unitPricePaise * item.quantity;
    let lineDiscountPaise = 0;
    if (eligibleItems.has(item)) {
      lineDiscountPaise = eligibleSubtotalPaise === lineSubtotalPaise
        ? remainingDiscountPaise
        : Math.floor(remainingDiscountPaise * lineSubtotalPaise / eligibleSubtotalPaise);
      eligibleSubtotalPaise -= lineSubtotalPaise;
      remainingDiscountPaise -= lineDiscountPaise;
    }
    return taxPaise + Math.round((lineSubtotalPaise - lineDiscountPaise) * item.gstPercent / 100);
  }, 0);
}

async function releaseStock(items, session) {
  await Promise.all(items.map(({ product, quantity }) => Product.updateOne(
    { _id: product },
    { $inc: { stock: quantity }, $set: { inStock: true } },
    { ...(session && { session }) },
  )));
}

async function reserveItems(items) {
  const reserved = [];
  try {
    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        { _id: item.productId, isActive: true, isDeleted: false, stock: { $gte: item.quantity } },
        [{ $set: { stock: { $subtract: ["$stock", item.quantity] } } }, { $set: { inStock: { $gt: ["$stock", 0] } } }],
        { new: true },
      );
      if (!product) throw new ApiError(409, "A cart item is unavailable or out of stock");
      if (product.currency !== "INR") throw new ApiError(400, "Only INR products can be checked out");
      const priced = priceItem(product, item.selectedOptions);
      reserved.push({ product: product._id, category: product.category, title: product.title, image: product.images?.[0] || "", quantity: item.quantity, ...priced });
    }
    return reserved;
  } catch (error) {
    await releaseStock(reserved);
    throw error;
  }
}

const addressSnapshot = (address) => ({
  fullName: address.fullName, phone: address.phone, alternatePhone: address.alternatePhone, line1: address.line1,
  line2: address.line2, landmark: address.landmark, city: address.city, state: address.state, country: address.country, postalCode: address.postalCode,
});

async function createCheckout({ user, items, addressId, paymentMethod, couponCode, idempotencyKey }) {
  const intent = checkoutIntent({ items, addressId, paymentMethod, couponCode });
  await expireCheckoutForUser(user.id);
  const existing = await Order.findOne({ user: user.id, idempotencyKey }).populate(["activePaymentTransaction", "paymentTransaction"]);
  if (existing) {
    assertMatchingCheckoutIntent(existing, intent);
    return existing;
  }
  const activeCheckout = await findActiveCheckout(user.id);
  if (activeCheckout) {
    const changes = intentChanges(activeCheckout, intent);
    if (!changes.length) return activeCheckout;
    if (!changes.includes("cart")) assertMatchingCheckoutIntent(activeCheckout, intent);
  }

  const address = await Address.findOne({ _id: addressId, user: user.id, isActive: true }).lean();
  if (!address) throw new ApiError(404, "Address not found");

  const coupon = await getCoupon(couponCode);
  let reserved = [];
  let order;
  let couponReserved = false;
  try {
    reserved = await reserveItems(items);
    const subtotalPaise = reserved.reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0);
    const eligibleSubtotalPaise = coupon ? validateCoupon(coupon, reserved, subtotalPaise) : 0;
    const discountPaise = coupon ? Math.min(percentageDiscount(eligibleSubtotalPaise, coupon.discountPercent), coupon.maxDiscountPaise || Infinity) : 0;
    const taxPaise = taxPaiseForItems(reserved, discountPaise, coupon);
    const totalPaise = subtotalPaise - discountPaise + taxPaise;
    if (!Number.isSafeInteger(totalPaise) || totalPaise < 0) throw new ApiError(400, "Checkout total cannot be negative");
    const plan = paymentPlan(totalPaise, paymentMethod);
    const pricing = { subtotalPaise, discountPaise, shippingPaise: 0, taxPaise, totalPaise, advancePaise: plan.advancePaise, balanceDuePaise: plan.balanceDuePaise, currency: "INR" };
    const expiresAt = new Date(Date.now() + env.checkoutExpiryMinutes * 60_000);
    if (coupon) {
      await reserveCoupon(coupon, user.id);
      couponReserved = true;
    }
    const isFreeOrder = totalPaise === 0;
    order = await Order.create({ user: user.id, orderNumber: orderNumber(), items: reserved, addressSnapshot: addressSnapshot(address), pricing, paymentMethod, ...(isFreeOrder && { status: "confirmed", paymentStatus: "paid" }), codBalanceDuePaise: plan.balanceDuePaise, couponCode: coupon?.code || "", coupon: coupon?._id || null, couponReservationStatus: coupon ? "reserved" : "none", checkoutIntent: intent, idempotencyKey, expiresAt });
    await recordFinancialAudit({ actor: user.id, actorType: "customer", order: order._id, action: "order_status_updated", previousState: {}, newState: { status: order.status, paymentStatus: order.paymentStatus }, correlationId: idempotencyKey });
    if (isFreeOrder) {
      await consumeCouponReservation(order);
      await removePurchasedCartItems(user.id, reserved);
      await recordOutboxEvent({ type: "ORDER_CONFIRMED", order: order._id, dedupeKey: `ORDER_CONFIRMED:${order._id}` });
      return order.populate(["activePaymentTransaction", "paymentTransaction"]);
    }
    const cashfree = await createCashfreeOrder({ orderNumber: order.orderNumber, amountPaise: pricing.advancePaise, user, idempotencyKey, paymentMethods: plan.paymentMethods, expiresAt });
    const payment = await PaymentTransaction.create({ order: order._id, attemptNumber: 1, gateway: "cashfree", cfOrderId: String(cashfree.cf_order_id), paymentSessionId: cashfree.payment_session_id, amountPaise: pricing.advancePaise });
    await recordFinancialAudit({ actor: user.id, actorType: "customer", order: order._id, paymentTransaction: payment._id, action: "payment_status_updated", previousState: {}, newState: { status: payment.status }, correlationId: idempotencyKey, paymentId: payment.cfPaymentId });
    order.activePaymentTransaction = payment._id;
    await order.save();
    await removePurchasedCartItems(user.id, reserved);
    await recordOutboxEvent({ type: "ORDER_RESERVED", order: order._id, paymentTransaction: payment._id, dedupeKey: `ORDER_RESERVED:${order._id}` });
    return order.populate(["activePaymentTransaction", "paymentTransaction"]);
  } catch (error) {
    if (order) {
      await releasePendingCheckout({ orderId: order._id, actor: user.id, actorType: "customer", correlationId: idempotencyKey });
    } else {
      await releaseStock(reserved);
      if (couponReserved) await releaseCouponUse(coupon._id, user.id);
    }
    throw error;
  }
}

async function createPaymentAttempt({ order, previousAttempt, cfPaymentId, actor = null, actorType = "system", correlationId = "" }) {
  const attemptNumber = (await PaymentTransaction.countDocuments({ order: order._id })) + 1;
  const attempt = await PaymentTransaction.create({
    order: order._id,
    attemptNumber,
    gateway: previousAttempt.gateway,
    cfOrderId: previousAttempt.cfOrderId,
    paymentSessionId: previousAttempt.paymentSessionId,
    amountPaise: previousAttempt.amountPaise,
    currency: previousAttempt.currency,
    ...(cfPaymentId && { cfPaymentId }),
  });
  await recordFinancialAudit({ actor, actorType, order: order._id, paymentTransaction: attempt._id, action: "payment_status_updated", previousState: {}, newState: { status: attempt.status }, correlationId, paymentId: attempt.cfPaymentId });
  return attempt;
}

async function paymentAttemptForGateway({ order, activeTransaction, paymentId, actor = null, actorType = "cashfree_webhook", correlationId = "" }) {
  if (!paymentId) return activeTransaction;
  const recordedAttempt = await PaymentTransaction.findOne({ order: order._id, cfPaymentId: paymentId });
  if (recordedAttempt || !activeTransaction?.cfPaymentId) return recordedAttempt || activeTransaction;

  try {
    const attempt = await createPaymentAttempt({ order, previousAttempt: activeTransaction, cfPaymentId: paymentId, actor, actorType, correlationId });
    await Order.updateOne(
      { _id: order._id, status: "pending_payment", activePaymentTransaction: activeTransaction._id },
      { $set: { activePaymentTransaction: attempt._id } },
    );
    return attempt;
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return PaymentTransaction.findOne({ order: order._id, cfPaymentId: paymentId });
  }
}

async function refreshRetryableAttempt(order, attempt, user) {
  if (!attempt?.cfPaymentId) throw new ApiError(409, "Payment is still being verified");

  const payments = await getCashfreePayments(order.orderNumber);
  const payment = payments.find((item) => String(item.cf_payment_id) === String(attempt.cfPaymentId));
  if (!payment) throw new ApiError(409, "Payment is still being verified");
  if (payment.payment_status === "SUCCESS") {
    const result = await resolveSuccessfulPayment({ order, attempt, paymentId: String(payment.cf_payment_id), rawPayload: JSON.stringify(payment), user, actor: user.id, actorType: "customer", correlationId: order.idempotencyKey });
    throw new ApiError(409, result.outcome === "confirmed" ? "Payment completed. Refresh your order details" : "Payment was received and is being reviewed. Do not pay again");
  }
  if (payment.payment_status === "PENDING" || payment.payment_status === "NOT_ATTEMPTED") {
    await applyCashfreePaymentState({ attempt, cashfreeStatus: payment.payment_status === "NOT_ATTEMPTED" ? "PENDING" : payment.payment_status, paymentId: String(payment.cf_payment_id || attempt.cfPaymentId), rawPayload: JSON.stringify(payment), actor: user.id, actorType: "customer", correlationId: order.idempotencyKey });
    throw new ApiError(409, "Payment is still being verified");
  }
  if (!["FAILED", "USER_DROPPED"].includes(payment.payment_status)) throw new ApiError(409, "Payment is still being verified");
  const result = await applyCashfreePaymentState({ attempt, cashfreeStatus: payment.payment_status, paymentId: String(payment.cf_payment_id || attempt.cfPaymentId), rawPayload: JSON.stringify(payment), actor: user.id, actorType: "customer", correlationId: order.idempotencyKey });
  if (!result.changed) return attempt;
  if (attempt.status === "failed") await releaseCouponReservation(order);
  return attempt;
}

async function retryCheckout({ user, orderNumber: requestedOrderNumber }) {
  const order = await Order.findOne({ user: user.id, orderNumber: requestedOrderNumber, status: "pending_payment" }).populate("activePaymentTransaction");
  if (!order) throw new ApiError(404, "An active checkout was not found");
  if (order.expiresAt <= new Date()) {
    await releasePendingCheckout({ orderId: order._id, expiresAt: { $lte: new Date() }, actor: user.id, actorType: "customer", correlationId: order.idempotencyKey });
    throw new ApiError(409, "Checkout expired. Start checkout again");
  }

  const previousAttempt = await refreshRetryableAttempt(order, order.activePaymentTransaction, user);
  await reserveCouponForOrder(order);

  const payment = await createPaymentAttempt({ order, previousAttempt, actor: user.id, actorType: "customer", correlationId: order.idempotencyKey });
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, status: "pending_payment", activePaymentTransaction: previousAttempt._id },
    { $set: { activePaymentTransaction: payment._id } },
    { new: true },
  ).populate(["activePaymentTransaction", "paymentTransaction"]);
  if (!updatedOrder) {
    await payment.deleteOne();
    throw new ApiError(409, "Payment retry is already in progress");
  }
  return updatedOrder;
}

async function reconcileActiveCheckout(order, user) {
  const activeTransaction = order.activePaymentTransaction || order.paymentTransaction;
  if (!activeTransaction) return { order, paymentPending: false };
  const payments = await getCashfreePayments(order.orderNumber);
  const successfulPayment = payments.find((payment) => payment.payment_status === "SUCCESS" && !paymentVerificationError({
    order,
    attempt: activeTransaction,
    payment,
    merchantOrderId: payment.order_id || order.orderNumber,
    cashfreeOrderId: payment.cf_order_id,
  }));
  if (successfulPayment) {
    const paymentId = String(successfulPayment.cf_payment_id);
    const attempt = await paymentAttemptForGateway({ order, activeTransaction, paymentId, actorType: "system_reconciliation", correlationId: `RECONCILIATION:${order._id}:${paymentId}` });
    const result = await resolveSuccessfulPayment({ order, attempt, paymentId, rawPayload: JSON.stringify(successfulPayment), user, actorType: "system_reconciliation", correlationId: `RECONCILIATION:${order._id}:${paymentId}` });
    return { order: result.order || order, paymentPending: false, result };
  }
  const terminalPayment = payments.find((payment) => ["FAILED", "USER_DROPPED", "CANCELLED", "VOID"].includes(payment.payment_status)
    && (!activeTransaction.cfPaymentId || String(payment.cf_payment_id) === String(activeTransaction.cfPaymentId)));
  if (terminalPayment) {
    const attempt = await paymentAttemptForGateway({ order, activeTransaction, paymentId: String(terminalPayment.cf_payment_id || ""), actorType: "system_reconciliation", correlationId: `RECONCILIATION:${order._id}:${terminalPayment.cf_payment_id || ""}` });
    if (attempt) {
      order.activePaymentTransaction = attempt;
      const result = await applyCashfreePaymentState({ attempt, cashfreeStatus: terminalPayment.payment_status, paymentId: String(terminalPayment.cf_payment_id || ""), rawPayload: JSON.stringify(terminalPayment), actorType: "system_reconciliation", correlationId: `RECONCILIATION:${order._id}:${terminalPayment.cf_payment_id || ""}` });
      if (["failed", "cancelled"].includes(result.state)) await releaseCouponReservation(order);
      if (isUnconfirmedPaymentState(result.state)) await recordFailedPaymentEmail({ order, attempt });
      return { order, paymentPending: false, paymentFailed: ["failed", "user_dropped", "cancelled"].includes(result.state), result };
    }
  }
  const pendingPayment = payments.find((payment) => payment.payment_status === "PENDING");
  if (pendingPayment) {
    const attempt = await paymentAttemptForGateway({ order, activeTransaction, paymentId: String(pendingPayment.cf_payment_id || ""), actorType: "system_reconciliation", correlationId: `RECONCILIATION:${order._id}:${pendingPayment.cf_payment_id || ""}` });
    if (attempt) {
      order.activePaymentTransaction = attempt;
      const result = await applyCashfreePaymentState({ attempt, cashfreeStatus: "PENDING", paymentId: String(pendingPayment.cf_payment_id || attempt.cfPaymentId || ""), rawPayload: JSON.stringify(pendingPayment), actorType: "system_reconciliation", correlationId: `RECONCILIATION:${order._id}:${pendingPayment.cf_payment_id || ""}` });
      return { order, paymentPending: true, result };
    }
  }
  return { order, paymentPending: activeTransaction.status === "pending" };
}

async function cancelActiveCheckout({ user, orderNumber: requestedOrderNumber }) {
  const order = await Order.findOne({ user: user.id, orderNumber: requestedOrderNumber, status: "pending_payment" })
    .populate(["activePaymentTransaction", "paymentTransaction"]);
  if (!order) throw new ApiError(404, "An active checkout was not found");
  const reconciliation = await reconcileActiveCheckout(order, user);
  if (reconciliation.result?.outcome === "confirmed") throw new ApiError(409, "Payment completed. The checkout cannot be cancelled");
  if (reconciliation.paymentPending) throw new ApiError(409, "Payment is still being verified. Do not cancel this checkout yet");
  const cancelledOrder = await releasePendingCheckout({ orderId: order._id, userId: user.id, actor: user.id, actorType: "customer", correlationId: order.idempotencyKey });
  if (!cancelledOrder) throw new ApiError(409, "Checkout status has changed");
  return cancelledOrder;
}

async function expireCheckoutForUser(userId) {
  return releasePendingCheckout({ userId, expiresAt: { $lte: new Date() } });
}

async function releasePendingCheckout({ orderId, userId, expiresAt, status = "cancelled", actor = null, actorType = "system", correlationId = "" }) {
  const cancelledOrder = await withTransaction(async (session) => {
    const order = await Order.findOneAndUpdate(
      { _id: orderId, ...(userId && { user: userId }), status: "pending_payment", ...(expiresAt && { expiresAt }) },
      { $set: { status, paymentStatus: "failed" } },
      { new: true, session },
    );
    if (!order) return null;
    const auditCorrelationId = correlationId || `SYSTEM:${order._id}`;
    await releaseStock(order.items, session);
    await releaseCouponReservation(order, session);
    await recordFinancialAudit({ actor, actorType, order: order._id, action: "order_status_updated", previousState: { status: "pending_payment" }, newState: { status: order.status, paymentStatus: order.paymentStatus }, correlationId: auditCorrelationId, session });
    if (expiresAt) await recordOutboxEvent({ type: "CHECKOUT_EXPIRED", order: order._id, dedupeKey: `CHECKOUT_EXPIRED:${order._id}`, session });
    return order;
  });
  if (!cancelledOrder) return null;
  const failedAttempt = await PaymentTransaction.findOne({ order: cancelledOrder._id, status: "failed", cashfreeStatus: "FAILED" }).sort({ processedAt: -1 });
  if (failedAttempt) await recordFailedPaymentEmail({ order: cancelledOrder, attempt: failedAttempt });
  return cancelledOrder;
}

async function findActiveCheckout(userId) {
  await expireCheckoutForUser(userId);
  return Order.findOne({ user: userId, status: "pending_payment", expiresAt: { $gt: new Date() } })
    .sort({ createdAt: -1 })
    .populate(["activePaymentTransaction", "paymentTransaction"]);
}

const transitions = Object.freeze({
  pending_payment: ["confirmed", "cancelled", "payment_review_required"],
  confirmed: ["processing", "cancel_requested", "refund_pending", "payment_review_required"],
  processing: ["shipped", "cancel_requested", "cancelled", "refund_pending", "payment_review_required"],
  shipped: ["delivered", "cancelled", "refund_pending"],
  delivered: ["refund_pending"],
  payment_failed: ["cancelled", "payment_review_required"],
  cancel_requested: ["cancelled", "refund_pending", "payment_review_required"],
  cancelled: ["payment_received_after_cancellation", "refund_pending"],
  payment_review_required: ["confirmed", "cancel_requested", "cancelled", "refund_pending"],
  payment_received_after_cancellation: ["refund_pending"],
  refund_pending: ["confirmed", "processing", "cancel_requested", "cancelled", "payment_review_required", "payment_received_after_cancellation", "partially_refunded", "refunded"],
  partially_refunded: ["refund_pending", "refunded"],
  refunded: [],
});

async function expirePendingOrders() {
  let order;
  while ((order = await Order.findOne({ status: "pending_payment", expiresAt: { $lte: new Date() } }))) await releasePendingCheckout({ orderId: order._id, expiresAt: { $lte: new Date() } });
}

module.exports = { assertMatchingCheckoutIntent, cancelActiveCheckout, checkoutIntent, createCheckout, createPaymentAttempt, paymentAttemptForGateway, retryCheckout, expirePendingOrders, findActiveCheckout, intentChanges, percentageDiscount, priceItem, reconcileActiveCheckout, releasePendingCheckout, releaseStock, taxPaiseForItems, transitions, toPaise, paymentPlan };
