const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { env } = require("./env");

const signAccessToken = (payload) => jwt.sign({ ...payload, type: "access" }, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpiry });
const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);
const createRefreshToken = () => crypto.randomBytes(48).toString("base64url");
const hashRefreshToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

module.exports = { signAccessToken, verifyAccessToken, createRefreshToken, hashRefreshToken };
