process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.CASHFREE_CLIENT_ID ||= "test-client";
process.env.CASHFREE_CLIENT_SECRET ||= "test-secret";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const mongoose = require("mongoose");
const test = require("node:test");
const { assertMatchingCheckoutIntent, cancelActiveCheckout, checkoutIntent, createCheckout, intentChanges, paymentPlan, percentageDiscount, priceItem, reconcileActiveCheckout, retryCheckout, taxPaiseForItems } = require("../src/services/checkout.service");
const Address = require("../src/models/address.model");
const Coupon = require("../src/models/coupon.model");
const Order = require("../src/models/order.model");
const PaymentTransaction = require("../src/models/paymentTransaction.model");
const Product = require("../src/models/product.model");
const User = require("../src/models/user.model");
const OutboxEvent = require("../src/models/outboxEvent.model");

test("COD always collects a one-third advance and leaves the balance due", () => {
  assert.deepEqual(paymentPlan(10_001, "cod"), { advancePaise: 3_334, balanceDuePaise: 6_667, paymentMethods: "upi,cc,dc" });
  assert.deepEqual(paymentPlan(10_001, "upi"), { advancePaise: 10_001, balanceDuePaise: 0, paymentMethods: "upi,cc,dc" });
});

test("percentage coupons discount the server-calculated subtotal", () => {
  assert.equal(percentageDiscount(99_999, 10), 9_999);
  assert.equal(percentageDiscount(99_999, 20), 19_999);
});

test("GST uses each product rate after its eligible coupon discount", () => {
  const items = [
    { product: "product-a", unitPricePaise: 10_000, quantity: 1, gstPercent: 5 },
    { product: "product-b", unitPricePaise: 10_000, quantity: 1, gstPercent: 18 },
  ];
  const coupon = { allowedProductIds: ["product-a"], allowedCategoryIds: [] };

  assert.equal(taxPaiseForItems(items, 1_000, coupon), 2_250);
});

test("checkout prices the option shown by the product page when legacy groups overlap", () => {
  const product = {
    basePrice: 100,
    optionPricing: {
      sizes: [{ value: "3-seater", label: "3 Seater", priceDelta: 20 }],
    },
    customizationGroups: [{
      key: "size",
      label: "Size",
      isRequired: true,
      options: [{ value: "queen", label: "Queen", priceDelta: 0 }],
    }],
  };

  const priced = priceItem(product, [{ key: "size", value: "3-seater" }]);
  assert.equal(priced.unitPricePaise, 12_000);
  assert.equal(priced.selectedOptions[0].value, "3 Seater");
});

test("checkout accepts the fabric and foam keys sent by the product page", () => {
  const product = {
    basePrice: 100,
    optionPricing: {
      fabrics: [{ value: "velvet", label: "Velvet", priceDelta: 20 }],
      foams: [{ value: "32-medium-soft", label: "32 - Medium Soft", priceDelta: 10 }],
    },
  };

  const priced = priceItem(product, [{ key: "fabric-types", value: "Velvet" }, { key: "foam-density", value: "32 - Medium Soft" }]);
  assert.equal(priced.unitPricePaise, 13_000);
});

test("checkout requires active required options", () => {
  const product = {
    basePrice: 100,
    customizationGroups: [{ key: "size", label: "Size", isRequired: true, isActive: true, options: [{ value: "queen", label: "Queen", priceDelta: 0, isActive: true }, { value: "king", label: "King", priceDelta: 10, isActive: false }] }],
  };

  assert.throws(() => priceItem(product, []), /Select Size/);
  assert.throws(() => priceItem(product, [{ key: "size", value: "king" }]), /Invalid product option/);
  assert.equal(priceItem(product, [{ key: "size", value: "queen" }]).unitPricePaise, 10_000);
});

test("active checkout intent identifies cart, address, payment, and coupon changes", () => {
  const intent = checkoutIntent({ items: [{ productId: "product-a", quantity: 1, selectedOptions: [{ key: "size", value: "king" }] }], addressId: "address-a", paymentMethod: "upi", couponCode: "WELCOME10" });
  const order = { checkoutIntent: intent };
  assert.deepEqual(intentChanges(order, intent), []);
  const changed = checkoutIntent({ items: [{ productId: "product-b", quantity: 1, selectedOptions: [] }], addressId: "address-b", paymentMethod: "cod", couponCode: "COMFORT20" });
  assert.deepEqual(intentChanges(order, changed), ["cart", "address", "payment method", "coupon"]);
  assert.throws(() => assertMatchingCheckoutIntent(order, changed), /Cancel it before starting/);
});

test("a new cart creates a separate pending checkout and removes its ordered items", async () => {
  const originals = {
    findAddress: Address.findOne,
    findOrder: Order.findOne,
    updateOrder: Order.findOneAndUpdate,
    createOrder: Order.create,
    reserveProduct: Product.findOneAndUpdate,
    createPayment: PaymentTransaction.create,
    findUser: User.findById,
    updateOutbox: OutboxEvent.updateOne,
    fetch: globalThis.fetch,
    startSession: mongoose.startSession,
  };
  const user = {
    cartItems: [{ product: "product-1", quantity: 1, selectedOptions: [] }],
    save: async () => {},
  };

  Address.findOne = () => ({ lean: async () => ({ fullName: "Test", phone: "9999999999" }) });
  const activeCheckout = { checkoutIntent: checkoutIntent({ items: [{ productId: "product-old", quantity: 1, selectedOptions: [] }], addressId: "address-old", paymentMethod: "upi", couponCode: "" }) };
  Order.findOne = (filter) => filter.idempotencyKey ? { populate: async () => null } : { sort: () => ({ populate: async () => activeCheckout }) };
  Order.findOneAndUpdate = async () => null;
  Order.create = async (values) => ({ ...values, _id: "order-1", save: async () => {}, populate: async function populate() { return this; } });
  Product.findOneAndUpdate = async () => ({ _id: "product-1", category: "category-1", title: "Product", basePrice: 100, currency: "INR", images: [] });
  PaymentTransaction.create = async (values) => ({ ...values, _id: "payment-1" });
  User.findById = async () => user;
  const outboxEvents = [];
  OutboxEvent.updateOne = async (...args) => { outboxEvents.push(args); };
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ cf_order_id: "cf-order", payment_session_id: "session" }) });
  mongoose.startSession = async () => ({ withTransaction: async (work) => work({}), endSession: async () => {} });

  try {
    const order = await createCheckout({ user: { id: "user-1", fullName: "Test", email: "test@example.com", mobileNumber: "9999999999" }, items: [{ productId: "product-1", quantity: 1, selectedOptions: [] }], addressId: "address-1", paymentMethod: "upi", idempotencyKey: crypto.randomUUID() });
    assert.deepEqual(user.cartItems, []);
    assert.deepEqual(order.pricing, { subtotalPaise: 10_000, discountPaise: 0, shippingPaise: 0, taxPaise: 1_800, totalPaise: 11_800, advancePaise: 11_800, balanceDuePaise: 0, currency: "INR" });
    assert.equal(outboxEvents[0][1].$setOnInsert.type, "ORDER_RESERVED");
  } finally {
    Address.findOne = originals.findAddress;
    Order.findOne = originals.findOrder;
    Order.findOneAndUpdate = originals.updateOrder;
    Order.create = originals.createOrder;
    Product.findOneAndUpdate = originals.reserveProduct;
    PaymentTransaction.create = originals.createPayment;
    User.findById = originals.findUser;
    OutboxEvent.updateOne = originals.updateOutbox;
    globalThis.fetch = originals.fetch;
    mongoose.startSession = originals.startSession;
  }
});

test("zero-value checkout confirms the order without Cashfree", async () => {
  const originals = {
    findAddress: Address.findOne,
    findOrder: Order.findOne,
    updateOrder: Order.findOneAndUpdate,
    createOrder: Order.create,
    reserveProduct: Product.findOneAndUpdate,
    createPayment: PaymentTransaction.create,
    findUser: User.findById,
    updateOutbox: OutboxEvent.updateOne,
    fetch: globalThis.fetch,
    startSession: mongoose.startSession,
  };
  const user = { cartItems: [{ product: "product-id", quantity: 1, selectedOptions: [] }], save: async () => {} };
  const outboxEvents = [];
  Address.findOne = () => ({ lean: async () => ({ fullName: "Test", phone: "9999999999" }) });
  Order.findOne = (filter) => filter.idempotencyKey ? { populate: async () => null } : { sort: () => ({ populate: async () => null }) };
  Order.findOneAndUpdate = async () => null;
  Order.create = async (values) => ({ ...values, _id: "order-id", populate: async function populate() { return this; } });
  Product.findOneAndUpdate = async () => ({ _id: "product-id", category: "category-id", title: "Free Product", basePrice: 0, gstPercent: 0, currency: "INR", images: [] });
  PaymentTransaction.create = async () => assert.fail("Free checkout must not create a payment attempt");
  User.findById = async () => user;
  OutboxEvent.updateOne = async (...args) => { outboxEvents.push(args); };
  globalThis.fetch = async () => assert.fail("Cashfree must not receive a zero-value checkout");
  mongoose.startSession = async () => ({ withTransaction: async (work) => work({}), endSession: async () => {} });
  try {
    const order = await createCheckout({ user: { id: "user-id" }, items: [{ productId: "product-id", quantity: 1, selectedOptions: [] }], addressId: "address-id", paymentMethod: "upi", idempotencyKey: crypto.randomUUID() });
    assert.equal(order.status, "confirmed");
    assert.equal(order.paymentStatus, "paid");
    assert.deepEqual(user.cartItems, []);
    assert.equal(outboxEvents[0][1].$setOnInsert.type, "ORDER_CONFIRMED");
  } finally {
    Address.findOne = originals.findAddress;
    Order.findOne = originals.findOrder;
    Order.findOneAndUpdate = originals.updateOrder;
    Order.create = originals.createOrder;
    Product.findOneAndUpdate = originals.reserveProduct;
    PaymentTransaction.create = originals.createPayment;
    User.findById = originals.findUser;
    OutboxEvent.updateOne = originals.updateOutbox;
    globalThis.fetch = originals.fetch;
    mongoose.startSession = originals.startSession;
  }
});

test("checkout rejects a negative payable total before Cashfree", async () => {
  const originals = [Address.findOne, Order.findOne, Order.findOneAndUpdate, Product.findOneAndUpdate, Product.updateOne];
  const originalStartSession = mongoose.startSession;
  const originalFetch = globalThis.fetch;
  let stockReleased = false;
  Address.findOne = () => ({ lean: async () => ({ fullName: "Test", phone: "9999999999" }) });
  Order.findOne = (filter) => filter.idempotencyKey ? { populate: async () => null } : { sort: () => ({ populate: async () => null }) };
  Order.findOneAndUpdate = async () => null;
  Product.findOneAndUpdate = async () => ({ _id: "product-id", category: "category-id", title: "Product", basePrice: -100, gstPercent: 0, currency: "INR", images: [] });
  Product.updateOne = async () => { stockReleased = true; };
  globalThis.fetch = async () => assert.fail("Cashfree must not receive a non-positive amount");
  mongoose.startSession = async () => ({ withTransaction: async (work) => work({}), endSession: async () => {} });
  try {
    await assert.rejects(
      createCheckout({ user: { id: "user-id" }, items: [{ productId: "negative-product", quantity: 1, selectedOptions: [] }], addressId: "address-id", paymentMethod: "upi", idempotencyKey: crypto.randomUUID() }),
      /total cannot be negative/,
    );
    assert.equal(stockReleased, true);
  } finally {
    [Address.findOne, Order.findOne, Order.findOneAndUpdate, Product.findOneAndUpdate, Product.updateOne] = originals;
    globalThis.fetch = originalFetch;
    mongoose.startSession = originalStartSession;
  }
});

test("an ineligible coupon releases stock before checkout is rejected", async () => {
  const originals = [Address.findOne, Coupon.findOne, Order.findOne, Order.findOneAndUpdate, Product.findOneAndUpdate, Product.updateOne];
  const originalStartSession = mongoose.startSession;
  let stockReleased = false;
  Address.findOne = () => ({ lean: async () => ({ fullName: "Test", phone: "9999999999" }) });
  Coupon.findOne = () => ({ lean: async () => ({ _id: "coupon-id", code: "MINIMUM", discountPercent: 10, minOrderPaise: 20_000, allowedProductIds: [], allowedCategoryIds: [] }) });
  Order.findOne = (filter) => filter.idempotencyKey ? { populate: async () => null } : { sort: () => ({ populate: async () => null }) };
  Order.findOneAndUpdate = async () => null;
  Product.findOneAndUpdate = async () => ({ _id: "product-id", category: "category-id", title: "Product", basePrice: 100, currency: "INR", images: [] });
  Product.updateOne = async () => { stockReleased = true; };
  mongoose.startSession = async () => ({ withTransaction: async (work) => work({}), endSession: async () => {} });
  try {
    await assert.rejects(
      createCheckout({ user: { id: "user-id" }, items: [{ productId: "product-id", quantity: 1, selectedOptions: [] }], addressId: "address-id", paymentMethod: "upi", couponCode: "MINIMUM", idempotencyKey: crypto.randomUUID() }),
      /minimum order/,
    );
    assert.equal(stockReleased, true);
  } finally {
    [Address.findOne, Coupon.findOne, Order.findOne, Order.findOneAndUpdate, Product.findOneAndUpdate, Product.updateOne] = originals;
    mongoose.startSession = originalStartSession;
  }
});

test("a Cashfree order timeout releases the checkout reservation", async () => {
  const originals = {
    findAddress: Address.findOne,
    findOrder: Order.findOne,
    updateOrder: Order.findOneAndUpdate,
    createOrder: Order.create,
    reserveProduct: Product.findOneAndUpdate,
    releaseProduct: Product.updateOne,
    findPayment: PaymentTransaction.findOne,
    fetch: globalThis.fetch,
    startSession: mongoose.startSession,
  };
  let stockReleased = false;
  const order = { _id: "order-1", orderNumber: "CC1", items: [{ product: "product-1", quantity: 1 }], save: async () => {} };
  Address.findOne = () => ({ lean: async () => ({ fullName: "Test", phone: "9999999999" }) });
  Order.findOne = (filter) => filter.idempotencyKey ? { populate: async () => null } : { sort: () => ({ populate: async () => null }) };
  Order.findOneAndUpdate = async (filter) => filter.expiresAt ? null : order;
  Order.create = async () => order;
  Product.findOneAndUpdate = async () => ({ _id: "product-1", category: "category-1", title: "Product", basePrice: 100, currency: "INR", images: [] });
  Product.updateOne = async () => { stockReleased = true; };
  PaymentTransaction.findOne = () => ({ sort: async () => null });
  globalThis.fetch = async () => { throw new Error("timeout"); };
  mongoose.startSession = async () => ({ withTransaction: async (work) => work({}), endSession: async () => {} });
  try {
    await assert.rejects(
      createCheckout({ user: { id: "user-1", fullName: "Test", email: "test@example.com", mobileNumber: "9999999999" }, items: [{ productId: "product-1", quantity: 1, selectedOptions: [] }], addressId: "address-1", paymentMethod: "upi", idempotencyKey: crypto.randomUUID() }),
      /Unable to start payment/,
    );
    assert.equal(stockReleased, true);
  } finally {
    Address.findOne = originals.findAddress;
    Order.findOne = originals.findOrder;
    Order.findOneAndUpdate = originals.updateOrder;
    Order.create = originals.createOrder;
    Product.findOneAndUpdate = originals.reserveProduct;
    Product.updateOne = originals.releaseProduct;
    PaymentTransaction.findOne = originals.findPayment;
    globalThis.fetch = originals.fetch;
    mongoose.startSession = originals.startSession;
  }
});

test("retry creates a new attempt without replacing the dropped one", async () => {
  const originalFindOrder = Order.findOne;
  const originalFindOrderAndUpdate = Order.findOneAndUpdate;
  const originalCount = PaymentTransaction.countDocuments;
  const originalCreate = PaymentTransaction.create;
  const originalFetch = globalThis.fetch;
  const previousAttempt = { _id: "attempt-1", status: "user_dropped", cfPaymentId: "payment-1", gateway: "cashfree", cfOrderId: "cf-order", paymentSessionId: "session", amountPaise: 10_000, currency: "INR", save: async () => {} };
  const order = { _id: "order-1", activePaymentTransaction: previousAttempt };
  let createdAttempt;

  Order.findOne = () => ({ populate: async () => order });
  PaymentTransaction.countDocuments = async () => 1;
  PaymentTransaction.create = async (values) => {
    createdAttempt = { ...values, _id: "attempt-2", deleteOne: async () => {} };
    return createdAttempt;
  };
  Order.findOneAndUpdate = (_filter, _update) => ({ populate: async () => ({ ...order, activePaymentTransaction: createdAttempt }) });
  globalThis.fetch = async () => ({ ok: true, json: async () => ([{ cf_payment_id: "payment-1", payment_status: "USER_DROPPED" }]) });
  try {
    const retriedOrder = await retryCheckout({ user: { id: "user-1" }, orderNumber: "CC123" });
    assert.equal(createdAttempt.attemptNumber, 2);
    assert.equal(createdAttempt.cfOrderId, previousAttempt.cfOrderId);
    assert.equal(previousAttempt.status, "user_dropped");
    assert.equal(retriedOrder.activePaymentTransaction._id, "attempt-2");
  } finally {
    Order.findOne = originalFindOrder;
    Order.findOneAndUpdate = originalFindOrderAndUpdate;
    PaymentTransaction.countDocuments = originalCount;
    PaymentTransaction.create = originalCreate;
    globalThis.fetch = originalFetch;
  }
});

test("a failed payment can retry with a new Cashfree attempt", async () => {
  const originals = {
    findOrder: Order.findOne,
    updateOrder: Order.findOneAndUpdate,
    countAttempts: PaymentTransaction.countDocuments,
    createAttempt: PaymentTransaction.create,
    fetch: globalThis.fetch,
  };
  const previousAttempt = { _id: "attempt-1", status: "failed", cfPaymentId: "payment-1", gateway: "cashfree", cfOrderId: "cf-order", paymentSessionId: "session", amountPaise: 10_000, currency: "INR", save: async () => {} };
  const order = { _id: "order-1", activePaymentTransaction: previousAttempt };
  let createdAttempt;
  Order.findOne = () => ({ populate: async () => order });
  PaymentTransaction.countDocuments = async () => 1;
  PaymentTransaction.create = async (values) => {
    createdAttempt = { ...values, _id: "attempt-2", deleteOne: async () => {} };
    return createdAttempt;
  };
  Order.findOneAndUpdate = () => ({ populate: async () => ({ ...order, activePaymentTransaction: createdAttempt }) });
  globalThis.fetch = async () => ({ ok: true, json: async () => ([{ cf_payment_id: "payment-1", payment_status: "FAILED" }]) });
  try {
    const retriedOrder = await retryCheckout({ user: { id: "user-1" }, orderNumber: "CC123" });
    assert.equal(createdAttempt.attemptNumber, 2);
    assert.equal(retriedOrder.activePaymentTransaction._id, "attempt-2");
  } finally {
    Order.findOne = originals.findOrder;
    Order.findOneAndUpdate = originals.updateOrder;
    PaymentTransaction.countDocuments = originals.countAttempts;
    PaymentTransaction.create = originals.createAttempt;
    globalThis.fetch = originals.fetch;
  }
});

test("a Cashfree failure is recorded immediately so the customer can return to the cart", async () => {
  const originals = {
    findAttempt: PaymentTransaction.findOne,
    hasPaidAttempt: PaymentTransaction.exists,
    outboxUpdate: OutboxEvent.updateOne,
    fetch: globalThis.fetch,
  };
  const attempt = { _id: "attempt-1", status: "pending", cfPaymentId: "payment-1", amountPaise: 10_000, currency: "INR", save: async () => {} };
  const order = { _id: "order-1", orderNumber: "CC123", status: "pending_payment", expiresAt: new Date(Date.now() + 60_000), couponReservationStatus: "none", activePaymentTransaction: attempt };
  const outboxEvents = [];
  PaymentTransaction.findOne = async () => attempt;
  PaymentTransaction.exists = async () => null;
  OutboxEvent.updateOne = async (...args) => { outboxEvents.push(args); };
  globalThis.fetch = async () => ({ ok: true, json: async () => ([{ cf_payment_id: "payment-1", payment_status: "FAILED" }]) });
  try {
    const result = await reconcileActiveCheckout(order, { id: "user-1" });
    assert.equal(result.paymentFailed, true);
    assert.equal(attempt.status, "failed");
    assert.equal(outboxEvents[0][1].$setOnInsert.type, "PAYMENT_FAILED");
  } finally {
    PaymentTransaction.findOne = originals.findAttempt;
    PaymentTransaction.exists = originals.hasPaidAttempt;
    OutboxEvent.updateOne = originals.outboxUpdate;
    globalThis.fetch = originals.fetch;
  }
});

test("a Cashfree pending attempt blocks another payment attempt", async () => {
  const originals = {
    findAttempt: PaymentTransaction.findOne,
    fetch: globalThis.fetch,
  };
  const attempt = { _id: "attempt-1", order: "order-1", status: "created", cashfreeStatus: "", save: async () => {} };
  const order = { _id: "order-1", orderNumber: "CC123", status: "pending_payment", activePaymentTransaction: attempt };
  PaymentTransaction.findOne = async () => attempt;
  globalThis.fetch = async () => ({ ok: true, json: async () => ([{ cf_payment_id: "payment-1", payment_status: "PENDING" }]) });
  try {
    const result = await reconcileActiveCheckout(order);
    assert.equal(result.paymentPending, true);
    assert.equal(order.activePaymentTransaction.status, "pending");
    assert.equal(order.activePaymentTransaction.cfPaymentId, "payment-1");
  } finally {
    PaymentTransaction.findOne = originals.findAttempt;
    globalThis.fetch = originals.fetch;
  }
});

test("retry expires a stale reservation before asking the customer to start again", async () => {
  const originalFindOrder = Order.findOne;
  const originalFindOrderAndUpdate = Order.findOneAndUpdate;
  const originalFindPayment = PaymentTransaction.findOne;
  const originalStartSession = mongoose.startSession;
  const originalUpdateOutbox = OutboxEvent.updateOne;
  const order = { _id: "order-1", expiresAt: new Date(Date.now() - 1), items: [], activePaymentTransaction: { _id: "attempt-1" } };
  let expired = false;
  const outboxEvents = [];

  Order.findOne = () => ({ populate: async () => order });
  Order.findOneAndUpdate = async () => {
    expired = true;
    return order;
  };
  PaymentTransaction.findOne = () => ({ sort: async () => null });
  OutboxEvent.updateOne = async (...args) => { outboxEvents.push(args); };
  mongoose.startSession = async () => ({ withTransaction: async (work) => work({}), endSession: async () => {} });
  try {
    await assert.rejects(retryCheckout({ user: { id: "user-1" }, orderNumber: "CC123" }), /Checkout expired/);
    assert.equal(expired, true);
    assert.equal(outboxEvents[0][1].$setOnInsert.type, "CHECKOUT_EXPIRED");
  } finally {
    Order.findOne = originalFindOrder;
    Order.findOneAndUpdate = originalFindOrderAndUpdate;
    PaymentTransaction.findOne = originalFindPayment;
    OutboxEvent.updateOne = originalUpdateOutbox;
    mongoose.startSession = originalStartSession;
  }
});

test("cancellation does not release a checkout while Cashfree reports payment pending", async () => {
  const originalFindOne = Order.findOne;
  const originalFindOneAndUpdate = Order.findOneAndUpdate;
  const originalFindPayment = PaymentTransaction.findOne;
  const originalFetch = globalThis.fetch;
  let cancellationAttempted = false;
  const order = { _id: "order-1", orderNumber: "CC123", status: "pending_payment", activePaymentTransaction: { status: "pending", cfPaymentId: "payment-1", save: async () => {} } };
  Order.findOne = () => ({ populate: async () => order });
  Order.findOneAndUpdate = async () => { cancellationAttempted = true; };
  PaymentTransaction.findOne = async () => order.activePaymentTransaction;
  globalThis.fetch = async () => ({ ok: true, json: async () => ([{ cf_payment_id: "payment-1", payment_status: "PENDING" }]) });
  try {
    await assert.rejects(cancelActiveCheckout({ user: { id: "user-1" }, orderNumber: "CC123" }), /still being verified/);
    assert.equal(cancellationAttempted, false);
  } finally {
    Order.findOne = originalFindOne;
    Order.findOneAndUpdate = originalFindOneAndUpdate;
    PaymentTransaction.findOne = originalFindPayment;
    globalThis.fetch = originalFetch;
  }
});
