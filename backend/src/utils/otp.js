const crypto = require("crypto");

const generateOtp = () => String(crypto.randomInt(100000, 999999));
const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");
const compareOtp = (otp, hash) => {
  const a = Buffer.from(hashOtp(otp));
  const b = Buffer.from(hash);
  // timingSafeEqual requires same length — both are sha256 hex (64 chars), so this is always safe
  // If somehow they differ (corrupted DB value), return false instead of throwing
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

module.exports = { generateOtp, hashOtp, compareOtp };
