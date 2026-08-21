const mongoose = require("mongoose");
const { env } = require("./env");

function supportsTransactions() {
  const topology = mongoose.connection.client?.topology?.description?.type;
  return topology === "ReplicaSetWithPrimary" || topology === "Sharded";
}

async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  if (env.nodeEnv === "production" && !supportsTransactions()) {
    await mongoose.disconnect();
    throw new Error("Production MongoDB must use a replica set to support checkout transactions");
  }
}

module.exports = { connectDB, supportsTransactions };
