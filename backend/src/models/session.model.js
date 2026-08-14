const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  familyId: { type: String, required: true, index: true },
  deviceInfo: { type: String, default: "unknown" },
  ipAddress: { type: String, default: "" },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  isRevoked: { type: Boolean, default: false },
  revokedAt: { type: Date, default: null },
  replacedByToken: { type: mongoose.Schema.Types.ObjectId, ref: "Session", default: null },
}, { timestamps: true });

module.exports = mongoose.model("Session", SessionSchema);
