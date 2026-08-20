/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const defaultEnvFile = process.env.NODE_ENV === "production" ? ".env" : ".env.development";
const envPath = process.env.SEED_ENV_FILE
  ? path.resolve(process.cwd(), process.env.SEED_ENV_FILE)
  : path.resolve(__dirname, "../..", defaultEnvFile);

dotenv.config(fs.existsSync(envPath) ? { path: envPath } : undefined);

const Coupon = require("../src/models/coupon.model");

async function seedCoupons() {
  await mongoose.connect(process.env.MONGODB_URI);

  try {
    await Coupon.bulkWrite([
      {
        updateOne: {
          filter: { code: "WELCOME10" },
          update: { $set: { code: "WELCOME10", title: "Welcome Offer", description: "Get 10% off your order.", discountPercent: 10, isActive: true, expiresAt: null } },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { code: "COMFORT20" },
          update: { $set: { code: "COMFORT20", title: "Comfort Savings", description: "Get 20% off your order.", discountPercent: 20, isActive: true, expiresAt: null } },
          upsert: true,
        },
      },
    ]);

    console.log("Coupon seed complete: WELCOME10 (10%), COMFORT20 (20%)");
  } finally {
    await mongoose.connection.close();
  }
}

seedCoupons().catch((error) => {
  console.error("Coupon seed failed:", error.message);
  process.exitCode = 1;
});
