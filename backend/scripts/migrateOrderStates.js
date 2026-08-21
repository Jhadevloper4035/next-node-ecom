const { connectDB } = require("../src/config/db");
const Order = require("../src/models/order.model");

async function migrateOrderStates() {
  await connectDB();
  const result = await Order.updateMany(
    { status: "payment_failed" },
    { $set: { status: "cancelled" } },
  );
  console.log(`Migrated ${result.modifiedCount} legacy payment-failed order(s).`);
}

migrateOrderStates().then(() => process.exit(0)).catch((error) => {
  console.error("Order-state migration failed:", error.message);
  process.exit(1);
});
