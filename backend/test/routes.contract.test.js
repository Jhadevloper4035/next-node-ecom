process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const auth = require("../src/middlewares/auth");
const requireRole = require("../src/middlewares/requireRole");
const { checkoutLimiter } = require("../src/middlewares/rateLimiters");
const app = require("../src/app");

const routers = {
  address: require("../src/routes/address.route"),
  admin: require("../src/routes/admin.route"),
  auth: require("../src/routes/auth.route"),
  blog: require("../src/routes/blog.route"),
  category: require("../src/routes/category.route"),
  checkout: require("../src/routes/checkout.route"),
  contact: require("../src/routes/contact.route"),
  order: require("../src/routes/order.route"),
  product: require("../src/routes/product.route"),
  review: require("../src/routes/review.route"),
  user: require("../src/routes/user.route"),
};

const expected = {
  address: "GET /|POST /|PUT /:addressId|DELETE /:addressId|PATCH /:addressId/default",
  admin: "GET /users|PATCH /users/:id/role|PATCH /users/:id/block",
  auth: "POST /register|POST /verify-email|POST /resend-verification|POST /login|POST /refresh|POST /logout|POST /logout-all|GET /me|POST /forgot-password|POST /reset-password|POST /change-password",
  blog: "GET /|GET /:url",
  category: "POST /|GET /|GET /tree|GET /stats|GET /slug/:slug|GET /:id|PUT /:id|DELETE /:id|POST /:id/restore|PATCH /bulk|POST /bulk-delete|POST /:parentId/subcategories|GET /:parentId/subcategories|PUT /:parentId/subcategories/reorder",
  checkout: "POST /",
  contact: "POST /submit",
  order: "GET /|GET /:orderId|PATCH /:orderId/status",
  product: "GET /|GET /slug/:slug|GET /category/:categorySlug|GET /category/:categorySlug/subcategory/:subcategorySlug|POST /|PUT /:id|DELETE /:id",
  review: "GET /product/:productId|POST /product/:productId",
  user: "GET /profile|PATCH /profile",
};

const getRoute = (router, method, path) => router.stack.find((layer) => layer.route?.path === path && layer.route.methods[method])?.route;
const endpoints = (router) => router.stack.flatMap((layer) => layer.route ? Object.keys(layer.route.methods).map((method) => `${method.toUpperCase()} ${layer.route.path}`) : []).sort();
const routeHandlers = (name, method, path) => getRoute(routers[name], method, path)?.stack.map((layer) => layer.handle) || [];
const specs = (text) => text.split("|").sort();

test("every declared backend endpoint has the expected method and path", () => {
  for (const [name, routes] of Object.entries(routers)) {
    assert.deepEqual(endpoints(routes), specs(expected[name]), `${name} route contract changed`);
  }
});

test("all private endpoints include authentication", () => {
  const privateRoutes = {
    address: expected.address,
    admin: expected.admin,
    checkout: expected.checkout,
    order: expected.order,
    user: expected.user,
    auth: "POST /logout-all|GET /me|POST /change-password",
    category: "POST /|GET /stats|PUT /:id|DELETE /:id|POST /:id/restore|PATCH /bulk|POST /bulk-delete|POST /:parentId/subcategories|PUT /:parentId/subcategories/reorder",
    product: "POST /|PUT /:id|DELETE /:id",
    review: "POST /product/:productId",
  };

  for (const [name, routes] of Object.entries(privateRoutes)) {
    for (const spec of specs(routes)) {
      const [method, path] = spec.split(" ");
      assert.ok(routeHandlers(name, method.toLowerCase(), path).includes(auth), `${name} ${spec} is missing auth`);
    }
  }
});

test("admin and payment routes retain their authorization and abuse controls", () => {
  const adminRoutes = [
    ["admin", "get", "/users"], ["admin", "patch", "/users/:id/role"], ["admin", "patch", "/users/:id/block"],
    ["category", "post", "/"], ["category", "get", "/stats"], ["category", "put", "/:id"], ["category", "delete", "/:id"], ["category", "post", "/:id/restore"], ["category", "patch", "/bulk"], ["category", "post", "/bulk-delete"], ["category", "post", "/:parentId/subcategories"], ["category", "put", "/:parentId/subcategories/reorder"],
    ["product", "post", "/"], ["product", "put", "/:id"], ["product", "delete", "/:id"], ["order", "patch", "/:orderId/status"],
  ];
  for (const [name, method, path] of adminRoutes) {
    const handlers = routeHandlers(name, method, path);
    assert.equal(handlers[0], auth, `${name} ${method} ${path} must authenticate first`);
    let error;
    handlers[1]({ user: { role: "user" } }, {}, (err) => { error = err; });
    assert.equal(error?.statusCode, 403, `${name} ${method} ${path} must require admin`);
  }
  assert.ok(routeHandlers("checkout", "post", "/").includes(checkoutLimiter), "checkout must be rate limited");
});

test("the API index mounts every route group and health endpoint", () => {
  const index = require("../src/routes");
  const mounted = index.stack.filter((layer) => layer.name === "router").map((layer) => layer.regexp.toString());
  for (const prefix of ["categories", "product", "address", "contact", "reviews", "blogs", "checkout", "orders", "auth", "users", "admin"]) {
    assert.ok(mounted.some((regexp) => regexp.includes(prefix)), `${prefix} is not mounted`);
  }
  assert.ok(getRoute(index, "get", "/health"), "health endpoint is missing");
});

test("direct application routes retain the root and signed Cashfree webhook", () => {
  const directRoutes = app._router.stack.filter((layer) => layer.route);
  const root = directRoutes.find((layer) => layer.route.path === "/" && layer.route.methods.get)?.route;
  const webhook = directRoutes.find((layer) => layer.route.path === "/api/v1/payments/cashfree/webhook" && layer.route.methods.post)?.route;
  assert.ok(root, "application root endpoint is missing");
  assert.ok(webhook, "Cashfree webhook endpoint is missing");
  assert.equal(webhook.stack.length, 2, "Cashfree webhook must keep its raw-body parser and controller");
});
