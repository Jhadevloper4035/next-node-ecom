const crypto = require("crypto");
const User = require("../models/User");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { env } = require("../config/env");
const { sendMail } = require("../config/mailer");
const { otpEmailTemplate, passwordResetEmailTemplate } = require("../utils/emailTemplates");
const { generateOtp, hashOtp, compareOtp } = require("../utils/otp");
const { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, hashRefreshToken } = require("../config/token");
const { toSafeUser } = require("../utils/safeUser");

const RESET_EXPIRES_MS = 15 * 60 * 1000;
const MAX_SESSIONS = 10;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure || env.nodeEnv === "production",
    sameSite: env.cookieSameSite,
    domain: env.cookieDomain,
    path: env.cookiePath,
  };
}

async function issueTokens(user, req, res) {
  const payload = { sub: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshTokens.push({
    tokenHash: hashRefreshToken(refreshToken),
    ip: (req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim(),
    userAgent: req.headers["user-agent"] || "unknown",
  });
  if (user.refreshTokens.length > MAX_SESSIONS) {
    user.refreshTokens = user.refreshTokens.slice(-MAX_SESSIONS);
  }
  await user.save();

  res.cookie(env.cookieName, refreshToken, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });

  const data = { accessToken };
  if (env.returnRefreshInBody) data.refreshToken = refreshToken;
  return data;
}

async function sendOtp(user) {
  const now = new Date();
  const windowMs = env.otpWindow * 60 * 1000;
  const cooldownMs = env.otpCooldown * 1000;

  if (!user.otpWindowStartAt || now - user.otpWindowStartAt > windowMs) {
    user.otpWindowStartAt = now;
    user.otpRequestCount = 0;
  }
  if (user.otpLastRequestedAt && now - user.otpLastRequestedAt < cooldownMs) return { sent: false, reason: "cooldown" };
  if (user.otpRequestCount >= env.otpMaxReqs) return { sent: false, reason: "rate_limited" };

  const otp = generateOtp();
  user.emailOtpHash = hashOtp(otp);
  user.emailOtpExpiresAt = new Date(now.getTime() + env.otpExpiry * 60 * 1000);
  user.otpRequestCount += 1;
  user.otpLastRequestedAt = now;
  await user.save();

  try {
    await sendMail({
      to: user.email,
      subject: `${env.appName} - Your OTP Code`,
      html: otpEmailTemplate({ appName: env.appName, otp, expiresMinutes: env.otpExpiry }),
    });
  } catch (err) {
    console.error("Failed to send OTP:", err.message);
  }

  return { sent: true };
}

exports.register = asyncHandler(async (req, res) => {
  const { fullName, email, password, mobileNumber } = req.body;
  let user = await User.findOne({ email });

  if (user && user.isEmailVerified) {
    return res.status(201).json(new ApiResponse({ message: "If an account exists, an OTP has been sent to your email.", data: null }));
  }

  if (!user) {
    user = await User.create({ fullName, email, password, mobileNumber });
  } else {
    user.fullName = fullName; user.mobileNumber = mobileNumber; user.password = password;
    await user.save();
  }

  await sendOtp(user);
  return res.status(201).json(new ApiResponse({ message: "If an account exists, an OTP has been sent to your email.", data: null }));
});

exports.resendOtp = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || user.isEmailVerified) {
    return res.status(200).json(new ApiResponse({ message: "If an account exists, an OTP has been sent to your email.", data: null }));
  }
  const result = await sendOtp(user);
  if (!result.sent) console.warn("OTP not sent:", result.reason, req.body.email);
  return res.status(200).json(new ApiResponse({ message: "If an account exists, an OTP has been sent to your email.", data: null }));
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user || !user.emailOtpHash) throw new ApiError(400, "Invalid OTP or email");
  if (user.isBlocked) throw new ApiError(403, "Account blocked");
  if (user.emailOtpExpiresAt < Date.now()) throw new ApiError(400, "OTP expired");
  if (!compareOtp(otp, user.emailOtpHash)) throw new ApiError(400, "Invalid OTP or email");

  user.isEmailVerified = true;
  user.emailOtpHash = null;
  user.emailOtpExpiresAt = null;
  user.otpRequestCount = 0;
  user.otpWindowStartAt = null;
  user.otpLastRequestedAt = null;
  user.refreshTokens = [];
  await user.save();

  const tokens = await issueTokens(user, req, res);
  return res.status(200).json(new ApiResponse({ message: "Email verified successfully", data: { user: toSafeUser(user), ...tokens } }));
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  // Check existence and blocked state BEFORE running bcrypt
  if (!user) throw new ApiError(401, "Invalid email or password");
  if (user.isBlocked) throw new ApiError(403, "Account blocked");

  if (!(await user.comparePassword(password))) throw new ApiError(401, "Invalid email or password");

  if (!user.isEmailVerified) {
    await sendOtp(user);
    throw new ApiError(403, "Account not verified. An OTP has been sent to your email.");
  }

  const tokens = await issueTokens(user, req, res);
  return res.status(200).json(new ApiResponse({ message: "Logged in successfully", data: { user: toSafeUser(user), ...tokens } }));
});

exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.cookieName] || req.body?.refreshToken;
  if (!token) throw new ApiError(401, "Unauthorized");

  let decoded;
  try { decoded = verifyRefreshToken(token); }
  catch { throw new ApiError(401, "Unauthorized"); }

  if (decoded.type !== "refresh") throw new ApiError(401, "Unauthorized");

  const tokenHash = hashRefreshToken(token);
  const user = await User.findOneAndUpdate(
    { _id: decoded.sub, "refreshTokens.tokenHash": tokenHash },
    { $pull: { refreshTokens: { tokenHash } } },
    { new: true }
  );

  if (!user) {
    await User.findByIdAndUpdate(decoded.sub, { $set: { refreshTokens: [] } });
    throw new ApiError(401, "Unauthorized");
  }
  if (user.isBlocked) throw new ApiError(403, "Account blocked");

  const tokens = await issueTokens(user, req, res);
  return res.status(200).json(new ApiResponse({ message: "Token refreshed", data: tokens }));
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.cookieName] || req.body?.refreshToken;

  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      const tokenHash = hashRefreshToken(token);
      await User.findByIdAndUpdate(decoded.sub, { $pull: { refreshTokens: { tokenHash } } });
    } catch { /* invalid — clear cookie anyway */ }
  } else {
    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
      try {
        const decoded = verifyAccessToken(header.slice(7));
        await User.findByIdAndUpdate(decoded.sub, { $set: { refreshTokens: [] } });
      } catch { /* nothing to do */ }
    }
  }

  res.clearCookie(env.cookieName, cookieOptions());
  return res.status(200).json(new ApiResponse({ message: "Logged out", data: null }));
});

exports.me = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse({ message: "OK", data: { user: toSafeUser(req.userDoc) } }));
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  console.log("Found user:", user);

  if (user && !user.isBlocked) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = new Date(Date.now() + RESET_EXPIRES_MS);

    await user.save();

    try {
      await sendMail({
        to: user.email,
        subject: `${env.appName} - Reset your password`,
        html: passwordResetEmailTemplate({ appName: env.appName, resetLink: `${env.frontendUrl}/reset-password?token=${rawToken}`, expiresMinutes: 15 }),
      });
    } catch (err) { console.error("Failed to send reset email:", err.message); }

  }

  return res.status(200).json(new ApiResponse({ message: "If an account exists, a password reset link has been sent to your email.", data: null }));
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash("sha256").update(req.body.token).digest("hex");
  const user = await User.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { $gt: new Date() } });

  if (!user) throw new ApiError(400, "Invalid or expired reset token");
  if (user.isBlocked) throw new ApiError(403, "Account blocked");

  user.password = req.body.password;
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  user.refreshTokens = [];
  await user.save();

  res.clearCookie(env.cookieName, cookieOptions());
  return res.status(200).json(new ApiResponse({ message: "Password reset successful. Please login again.", data: null }));
});

exports.changePassword = asyncHandler(async (req, res) => {
  const user = req.userDoc;

  if (user.isBlocked) throw new ApiError(403, "Account blocked");
  if (!await user.comparePassword(req.body.currentPassword)) throw new ApiError(400, "Current password is incorrect");

  user.password = req.body.newPassword;
  user.refreshTokens = [];
  await user.save();

  res.clearCookie(env.cookieName, cookieOptions());
  return res.status(200).json(new ApiResponse({ message: "Password changed successfully. Please login again.", data: null }));
});