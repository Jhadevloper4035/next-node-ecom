const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["user", "admin"];

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true, minlength: 2, maxlength: 60, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 10, maxlength: 72 },
  mobileNumber: { type: String, required: true },
  role: { type: String, enum: ROLES, default: "user" },
  isEmailVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },

  emailOtpHash: { type: String, default: null },
  emailOtpExpiresAt: { type: Date, default: null },

  otpRequestCount: { type: Number, default: 0 },
  otpWindowStartAt: { type: Date, default: null },
  otpLastRequestedAt: { type: Date, default: null },

  refreshTokens: {
    type: [{ tokenHash: { type: String, required: true }, ip: String, userAgent: String, createdAt: { type: Date, default: Date.now } }],
    default: [],
    _id: false,
  },

  passwordResetTokenHash: { type: String, default: null },
  passwordResetExpiresAt: { type: Date, default: null },
}, { timestamps: true });


UserSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", UserSchema);
