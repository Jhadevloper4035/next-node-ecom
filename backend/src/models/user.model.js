const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["user", "admin"];

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true, minlength: 2, maxlength: 60, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  role: { type: String, enum: ROLES, default: "user" },
  isEmailVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },

  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  tokenVersion: { type: Number, default: 0 },
}, { timestamps: true });

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", UserSchema);
