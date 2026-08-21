const { connectDB } = require("../src/config/db");
const PaymentTransaction = require("../src/models/paymentTransaction.model");
const PaymentWebhookEvent = require("../src/models/paymentWebhookEvent.model");

async function migratePaymentAttempts() {
  await connectDB();

  const attempts = await PaymentTransaction.find().sort({ order: 1, createdAt: 1, _id: 1 });
  const counters = new Map();
  const operations = attempts.map((attempt) => {
    const orderId = String(attempt.order);
    const attemptNumber = (counters.get(orderId) || 0) + 1;
    counters.set(orderId, attemptNumber);
    return { updateOne: { filter: { _id: attempt._id }, update: { $set: { attemptNumber } } } };
  });
  if (operations.length) await PaymentTransaction.bulkWrite(operations);

  const indexes = await PaymentTransaction.collection.indexes();
  if (indexes.some((index) => index.name === "order_1" && index.unique)) await PaymentTransaction.collection.dropIndex("order_1");
  if (indexes.some((index) => index.name === "cfOrderId_1" && index.unique)) await PaymentTransaction.collection.dropIndex("cfOrderId_1");
  await PaymentTransaction.collection.createIndex({ order: 1, attemptNumber: 1 }, { unique: true });
  await PaymentTransaction.collection.createIndex({ order: 1, createdAt: -1 });
  await PaymentWebhookEvent.collection.createIndex({ gateway: 1, dedupeKey: 1 }, { unique: true });
  await PaymentWebhookEvent.collection.createIndex({ cfPaymentId: 1, eventType: 1 });
  console.log(`Migrated ${attempts.length} payment attempts.`);
}

migratePaymentAttempts().then(() => process.exit(0)).catch((error) => {
  console.error("Payment-attempt migration failed:", error.message);
  process.exit(1);
});
