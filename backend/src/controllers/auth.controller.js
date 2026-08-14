const crypto = require("crypto");
const User = require("../models/user.model");
const Session = require("../models/session.model");
const EmailVerificationToken = require("../models/emailVerificationToken.model");
const PasswordResetToken = require("../models/passwordResetToken.model");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { env } = require("../config/env");
const { sendMail } = require("../config/mailer");
const { verificationEmailTemplate, passwordResetEmailTemplate, passwordChangedEmailTemplate } = require("../utils/emailTemplates");
const { signAccessToken, createRefreshToken, hashRefreshToken } = require("../config/token");
const { toSafeUser } = require("../utils/safeUser");

const RESET_EXPIRES_MS = 15 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure || env.nodeEnv === "production",
    sameSite: env.cookieSameSite,
    domain: env.cookieDomain,
    path: env.cookiePath,
  };
}

function accessCookieOptions() {
  return { ...cookieOptions(), path: env.accessCookiePath };
}

function setAccessToken(user, res) {
  res.cookie(env.accessCookieName, signAccessToken({ sub: user._id.toString(), role: user.role, tokenVersion: user.tokenVersion }), accessCookieOptions());
}

function clearAuthCookies(res) {
  res.clearCookie(env.cookieName, cookieOptions());
  res.clearCookie(env.accessCookieName, accessCookieOptions());
}

function requestMeta(req) {
  return {
    ipAddress: req.ip || "",
    deviceInfo: req.headers["user-agent"] || "unknown",
  };
}

function queueMail(mail) {
  sendMail(mail).catch((error) => console.error("Email delivery failed:", error.message));
}

async function createToken(TokenModel, userId, expiresInMs) {
  const token = crypto.randomBytes(32).toString("hex");
  await TokenModel.deleteMany({ userId });
  await TokenModel.create({
    userId,
    tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + expiresInMs),
  });
  return token;
}

async function sendVerificationEmail(user) {
  const token = await createToken(EmailVerificationToken, user._id, env.verificationExpiry * 60 * 1000);
  queueMail({
    to: user.email,
    subject: "Curve & Comfort - Verify your email",
    html: verificationEmailTemplate({
      appName: env.appName,
      verificationLink: `${env.frontendUrl}/verify-email#token=${token}`,
      expiresMinutes: env.verificationExpiry,
    }),
  });
}

async function createSession(user, req, familyId = crypto.randomUUID()) {
  const refreshToken = createRefreshToken();
  const session = await Session.create({
    userId: user._id,
    familyId,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: new Date(Date.now() + env.refreshTokenDays * 24 * 60 * 60 * 1000),
    ...requestMeta(req),
  });

  const oldSessions = await Session.find({ userId: user._id, isRevoked: false })
    .sort({ createdAt: -1 })
    .skip(env.maxSessions)
    .select("_id");
  if (oldSessions.length) {
    await Session.updateMany({ _id: { $in: oldSessions } }, { $set: { isRevoked: true, revokedAt: new Date() } });
  }
  return { refreshToken, session };
}

async function issueTokens(user, req, res, familyId) {
  const { refreshToken, session } = await createSession(user, req, familyId);
  res.cookie(env.cookieName, refreshToken, {
    ...cookieOptions(),
    maxAge: env.refreshTokenDays * 24 * 60 * 60 * 1000,
  });
  setAccessToken(user, res);
  return { session };
}

async function revokeFamilyForReuse(tokenHash) {
  const reusedSession = await Session.findOne({ tokenHash }).select("familyId");
  if (reusedSession) {
    await Session.updateMany({ familyId: reusedSession.familyId }, { $set: { isRevoked: true, revokedAt: new Date() } });
  }
}

exports.register = asyncHandler(async (req, res) => {
  const { fullName, email, password, mobileNumber } = req.body;
  let user = await User.findOne({ email });
  if (!user) user = await User.create({ fullName, email, password, mobileNumber });
  if (!user.isEmailVerified) await sendVerificationEmail(user);
  return res.status(201).json(new ApiResponse({ message: "If an account exists, a verification link has been sent to your email.", data: null }));
});

exports.resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user && !user.isEmailVerified) await sendVerificationEmail(user);
  return res.status(200).json(new ApiResponse({ message: "If an account exists, a verification link has been sent to your email.", data: null }));
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash("sha256").update(req.body.token).digest("hex");
  const verification = await EmailVerificationToken.findOneAndDelete({ tokenHash, expiresAt: { $gt: new Date() } });
  if (!verification) throw new ApiError(400, "Invalid or expired verification link");

  const user = await User.findById(verification.userId);
  if (!user || user.isBlocked) throw new ApiError(403, "Account unavailable");
  user.isEmailVerified = true;
  await user.save();

  await issueTokens(user, req, res);
  return res.status(200).json(new ApiResponse({ message: "Email verified successfully", data: { user: toSafeUser(user) } }));
});

exports.login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new ApiError(401, "Invalid email or password");
  if (user.isBlocked) throw new ApiError(403, "Account blocked");
  if (user.lockedUntil && user.lockedUntil > new Date()) throw new ApiError(429, "Account temporarily locked. Please try again later.");

  if (!(await user.comparePassword(req.body.password))) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= env.loginMaxAttempts) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = new Date(Date.now() + env.accountLockMinutes * 60 * 1000);
    }
    await user.save();
    throw new ApiError(401, "Invalid email or password");
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();
  if (!user.isEmailVerified) {
    await sendVerificationEmail(user);
    throw new ApiError(403, "Please verify your email before logging in.");
  }

  await issueTokens(user, req, res);
  return res.status(200).json(new ApiResponse({ message: "Logged in successfully", data: { user: toSafeUser(user) } }));
});

exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.cookieName];
  if (!token) throw new ApiError(401, "Unauthorized");

  const tokenHash = hashRefreshToken(token);
  const session = await Session.findOneAndUpdate(
    { tokenHash, isRevoked: false, expiresAt: { $gt: new Date() } },
    { $set: { isRevoked: true, revokedAt: new Date() } },
    { new: true },
  );
  if (!session) {
    await revokeFamilyForReuse(tokenHash);
    throw new ApiError(401, "Unauthorized");
  }

  const user = await User.findById(session.userId);
  if (!user || user.isBlocked) throw new ApiError(401, "Unauthorized");
  const { session: replacement } = await issueTokens(user, req, res, session.familyId);
  await Session.findByIdAndUpdate(session._id, { $set: { replacedByToken: replacement._id } });
  return res.status(200).json(new ApiResponse({ message: "Token refreshed", data: null }));
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.cookieName];
  if (token) await Session.updateOne({ tokenHash: hashRefreshToken(token) }, { $set: { isRevoked: true, revokedAt: new Date() } });
  clearAuthCookies(res);
  return res.status(200).json(new ApiResponse({ message: "Logged out", data: null }));
});

exports.logoutAll = asyncHandler(async (req, res) => {
  await Session.updateMany({ userId: req.user.id, isRevoked: false }, { $set: { isRevoked: true, revokedAt: new Date() } });
  await User.updateOne({ _id: req.user.id }, { $inc: { tokenVersion: 1 } });
  clearAuthCookies(res);
  return res.status(200).json(new ApiResponse({ message: "Logged out from all devices", data: null }));
});

exports.me = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse({ message: "OK", data: { user: toSafeUser(req.userDoc) } }));
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user && !user.isBlocked) {
    const token = await createToken(PasswordResetToken, user._id, RESET_EXPIRES_MS);
    queueMail({
      to: user.email,
      subject: "Curve & Comfort - Reset your password",
      html: passwordResetEmailTemplate({ resetLink: `${env.frontendUrl}/reset-password#token=${token}`, expiresMinutes: 15 }),
    });
  }
  return res.status(200).json(new ApiResponse({ message: "If an account exists, a password reset link has been sent to your email.", data: null }));
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash("sha256").update(req.body.token).digest("hex");
  const reset = await PasswordResetToken.findOneAndDelete({ tokenHash, expiresAt: { $gt: new Date() } });
  if (!reset) throw new ApiError(400, "Invalid or expired reset token");

  const user = await User.findById(reset.userId);
  if (!user || user.isBlocked) throw new ApiError(403, "Account unavailable");
  user.password = req.body.password;
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.tokenVersion += 1;
  await user.save();
  await Session.updateMany({ userId: user._id, isRevoked: false }, { $set: { isRevoked: true, revokedAt: new Date() } });
  queueMail({ to: user.email, subject: "Curve & Comfort - Password changed", html: passwordChangedEmailTemplate() });

  clearAuthCookies(res);
  return res.status(200).json(new ApiResponse({ message: "Password reset successful. Please login again.", data: null }));
});

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || user.isBlocked) throw new ApiError(403, "Account unavailable");
  if (!(await user.comparePassword(req.body.currentPassword))) throw new ApiError(400, "Current password is incorrect");

  user.password = req.body.newPassword;
  user.tokenVersion += 1;
  await user.save();
  const currentToken = req.cookies?.[env.cookieName];
  const currentSession = currentToken && await Session.findOne({ tokenHash: hashRefreshToken(currentToken) }).select("_id");
  const filter = { userId: user._id, isRevoked: false };
  if (currentSession) filter._id = { $ne: currentSession._id };
  await Session.updateMany(filter, { $set: { isRevoked: true, revokedAt: new Date() } });
  setAccessToken(user, res);
  queueMail({ to: user.email, subject: "Curve & Comfort - Password changed", html: passwordChangedEmailTemplate() });
  return res.status(200).json(new ApiResponse({ message: "Password changed successfully.", data: null }));
});
