const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { env } = require("./env");

const signAccessToken  = (payload) => jwt.sign({ ...payload, type: "access" },  env.jwtAccessSecret,  { expiresIn: env.jwtAccessExpiry });
const signRefreshToken = (payload) => jwt.sign({ ...payload, type: "refresh" }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiry });
const verifyAccessToken  = (token) => jwt.verify(token, env.jwtAccessSecret);
const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
const hashRefreshToken   = (token) => crypto.createHmac("sha256", env.jwtRefreshSecret).update(token).digest("hex");

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, hashRefreshToken };
