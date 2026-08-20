const crypto = require("crypto");
const Address = require("../models/address.model");
const Order = require("../models/order.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const Product = require("../models/product.model");
const Coupon = require("../models/coupon.model");
const { env } = require("../config/env");
const { createCashfreeOrder } = require("./payment.service");
const ApiError = require("../utils/ApiError");

const toPaise = (amount) => Math.round(Number(amount) * 100);
const orderNumber = () => `CC${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
const paymentPlan = (totalPaise, paymentMethod) => paymentMethod === "cod"
  ? { advancePaise: Math.ceil(totalPaise / 3), balanceDuePaise: totalPaise - Math.ceil(totalPaise / 3), paymentMethods: "upi,cc,dc" }
  : { advancePaise: totalPaise, balanceDuePaise: 0, paymentMethods: paymentMethod === "upi" ? "upi" : "cc,dc" };
const percentageDiscount = (subtotalPaise, discountPercent) => Math.floor(subtotalPaise * discountPercent / 100);

async function getCoupon(code) {
  if (!code) return null;
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).lean();
  if (!coupon) throw new ApiError(400, "Coupon is invalid or expired");
  return coupon;
}

const optionGroups = (product) => [
  ...Object.entries(product.optionPricing || {}).map(([key, options]) => ({ key: key.replace(/s$/, ""), label: key, options: (options || []).filter((option) => option.isActive !== false) })),
  ...(product.customizationGroups || [])
    .filter((group) => group.isActive !== false)
    .map((group) => ({ key: group.key, label: group.label, isRequired: group.isRequired === true, options: (group.options || []).filter((option) => option.isActive !== false) })),
];

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
  return { unitPricePaise, selectedOptions: snapshot };
}

async function releaseStock(items) {
  await Promise.all(items.map(({ product, quantity }) => Product.updateOne({ _id: product }, { $inc: { stock: quantity }, $set: { inStock: true } })));
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
      reserved.push({ product: product._id, title: product.title, image: product.images?.[0] || "", quantity: item.quantity, ...priced });
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
  const existing = await Order.findOne({ user: user.id, idempotencyKey }).populate("paymentTransaction");
  if (existing) return existing;
  const activeCheckout = await findActiveCheckout(user.id);
  if (activeCheckout) return activeCheckout;

  const address = await Address.findOne({ _id: addressId, user: user.id, isActive: true }).lean();
  if (!address) throw new ApiError(404, "Address not found");

  const coupon = await getCoupon(couponCode);
  const reserved = await reserveItems(items);
  const subtotalPaise = reserved.reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0);
  const discountPaise = coupon ? percentageDiscount(subtotalPaise, coupon.discountPercent) : 0;
  const totalPaise = subtotalPaise - discountPaise;
  const plan = paymentPlan(totalPaise, paymentMethod);
  const pricing = { subtotalPaise, discountPaise, shippingPaise: 0, taxPaise: 0, totalPaise, advancePaise: plan.advancePaise, balanceDuePaise: plan.balanceDuePaise, currency: "INR" };
  const expiresAt = new Date(Date.now() + env.checkoutExpiryMinutes * 60_000);
  let order;
  try {
    order = await Order.create({ user: user.id, orderNumber: orderNumber(), items: reserved, addressSnapshot: addressSnapshot(address), pricing, paymentMethod, couponCode: coupon?.code || "", idempotencyKey, expiresAt });
    const cashfree = await createCashfreeOrder({ orderNumber: order.orderNumber, amountPaise: pricing.advancePaise, user, idempotencyKey, paymentMethods: plan.paymentMethods, expiresAt });
    const payment = await PaymentTransaction.create({ order: order._id, gateway: "cashfree", cfOrderId: String(cashfree.cf_order_id), paymentSessionId: cashfree.payment_session_id, amountPaise: pricing.advancePaise });
    order.paymentTransaction = payment._id;
    await order.save();
    return order.populate("paymentTransaction");
  } catch (error) {
    await releaseStock(reserved);
    if (order) await Order.updateOne({ _id: order._id }, { $set: { status: "payment_failed", paymentStatus: "failed" } });
    throw error;
  }
}

function findActiveCheckout(userId) {
  return Order.findOne({ user: userId, status: "pending_payment", expiresAt: { $gt: new Date() } })
    .sort({ createdAt: -1 })
    .populate("paymentTransaction");
}

const transitions = {
  pending_payment: ["payment_failed", "cancelled"], confirmed: ["processing", "cancelled"], processing: ["shipped"], shipped: ["delivered"],
  delivered: [], payment_failed: [], cancelled: ["refunded"], refunded: [],
};

async function expirePendingOrders() {
  let order;
  while ((order = await Order.findOneAndUpdate({ status: "pending_payment", expiresAt: { $lte: new Date() } }, { $set: { status: "cancelled", paymentStatus: "failed" } }, { new: true }))) {
    await releaseStock(order.items);
  }
}

module.exports = { createCheckout, expirePendingOrders, findActiveCheckout, percentageDiscount, priceItem, releaseStock, transitions, toPaise, paymentPlan };
