const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss");
const pinoHttp = require("pino-http");
const { env } = require("./config/env");
const logger = require("./config/logger");

const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const requireFrontendOrigin = require("./middlewares/requireFrontendOrigin");
const paymentController = require("./controllers/payment.controller");

const routes = require("./routes");

const app = express();

if (env.trustProxy) app.set("trust proxy", 1);

app.use(pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url === "/api/v1/health" },
}));
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin.length ? env.corsOrigin : true,
    credentials: env.corsCredentials,
  }),
);
app.post(
  "/api/v1/payments/cashfree/webhook",
  express.raw({ type: "application/json" }),
  paymentController.cashfreeWebhook,
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(requireFrontendOrigin([env.frontendUrl, ...env.corsOrigin]));

app.use((req, _res, next) => {
  function clean(v) {
    if (typeof v === "string") return xss(v);
    if (Array.isArray(v)) return v.map(clean);
    if (v && typeof v === "object")
      return Object.fromEntries(
        Object.entries(v).map(([k, val]) => [k, clean(val)]),
      );
    return v;
  }
  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query);
  if (req.params) req.params = clean(req.params);
  next();
});

app.get("/", (_req, res) => res.json({ ok: true, name: env.appName }));

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
