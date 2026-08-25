process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const auth = require("../src/middlewares/auth");
const requireRole = require("../src/middlewares/requireRole");
const { checkoutLimiter, emailResendLimiter, refundLimiter } = require("../src/middlewares/rateLimiters");
const app = require("../src/app");

const controllers = {
  address: require("../src/controllers/address.controller"),
  admin: require("../src/controllers/admin.controller"),
  auth: require("../src/controllers/auth.controller"),
  blog: require("../src/controllers/blog.controller"),
  cart: require("../src/controllers/cart.controller"),
  wishlist: require("../src/controllers/wishlist.controller"),
  category: require("../src/controllers/category.controller"),
  checkout: require("../src/controllers/checkout.controller"),
  contact: require("../src/controllers/contact.controller"),
  coupon: require("../src/controllers/coupon.controller"),
  newsletter: require("../src/controllers/newsletter.controller"),
  seo: require("../src/controllers/seo.controller"),
  health: require("../src/controllers/health.controller"),
  order: require("../src/controllers/order.controller"),
  payment: require("../src/controllers/payment.controller"),
  product: require("../src/controllers/product.controller"),
  review: require("../src/controllers/review.controller"),
  user: require("../src/controllers/user.controller"),
};

const routers = {
  address: require("../src/routes/address.route"),
  admin: require("../src/routes/admin.route"),
  auth: require("../src/routes/auth.route"),
  blog: require("../src/routes/blog.route"),
  cart: require("../src/routes/cart.route"),
  wishlist: require("../src/routes/wishlist.route"),
  category: require("../src/routes/category.route"),
  checkout: require("../src/routes/checkout.route"),
  contact: require("../src/routes/contact.route"),
  coupon: require("../src/routes/coupon.route"),
  newsletter: require("../src/routes/newsletter.route"),
  seo: require("../src/routes/seo.route"),
  order: require("../src/routes/order.route"),
  product: require("../src/routes/product.route"),
  review: require("../src/routes/review.route"),
  user: require("../src/routes/user.route"),
};

const expected = {
  address: "GET /|POST /|PUT /:addressId|DELETE /:addressId|PATCH /:addressId/default",
  admin: "GET /dashboard|GET /monitoring|GET /payments|POST /payments/:orderId/reconcile|GET /users|PATCH /users/:id/role|PATCH /users/:id/block",
  auth: "POST /register|POST /verify-email|POST /resend-verification|POST /login|POST /refresh|POST /logout|POST /logout-all|GET /me|POST /forgot-password|POST /reset-password|POST /change-password",
  blog: "GET /|GET /taxonomies|GET /sitemap|GET /:url",
  cart: "GET /|PUT /",
  wishlist: "GET /|PUT /",
  category: "POST /|GET /|GET /tree|GET /sitemap|GET /stats|GET /slug/:slug|GET /:id|PUT /:id|DELETE /:id|POST /:id/restore|PATCH /bulk|POST /bulk-delete|POST /:parentId/subcategories|GET /:parentId/subcategories|PUT /:parentId/subcategories/reorder",
  checkout: "DELETE /:orderId|GET /active|POST /|POST /:orderId/retry",
  contact: "POST /submit",
  coupon: "GET /:code|POST /|PATCH /:couponId",
  newsletter: "POST /subscribe",
  seo: "GET /sitemap|GET /:pageSlug",
  order: "GET /|GET /:orderId|PATCH /:orderId/status|POST /:orderId/refunds|POST /:orderId/emails/:emailEventId/resend",
  product: "GET /|GET /slug/:slug|GET /sitemap|GET /category/:categorySlug|GET /category/:categorySlug/subcategory/:subcategorySlug|POST /|PUT /:id|DELETE /:id",
  review: "GET /product/:productId|POST /product/:productId",
  user: "GET /profile|PATCH /profile",
};

const controllerHandlers = {
  address: {
    "GET /": "getAllAddresses", "POST /": "createMyAddress", "PUT /:addressId": "updateMyAddress",
    "DELETE /:addressId": "deleteMyAddress", "PATCH /:addressId/default": "setDefaultAddress",
  },
  admin: { "GET /dashboard": "dashboard", "GET /monitoring": "monitoring", "GET /payments": "paymentTimeline", "POST /payments/:orderId/reconcile": "reconcilePayment", "GET /users": "listUsers", "PATCH /users/:id/role": "updateUserRole", "PATCH /users/:id/block": "blockUser" },
  auth: {
    "POST /register": "register", "POST /verify-email": "verifyEmail", "POST /resend-verification": "resendVerification",
    "POST /login": "login", "POST /refresh": "refresh", "POST /logout": "logout", "POST /logout-all": "logoutAll",
    "GET /me": "me", "POST /forgot-password": "forgotPassword", "POST /reset-password": "resetPassword",
    "POST /change-password": "changePassword",
  },
  blog: { "GET /": "listBlogs", "GET /taxonomies": "listBlogTaxonomies", "GET /sitemap": "getSitemapBlogs", "GET /:url": "getBlogByUrl" },
  cart: { "GET /": "getCart", "PUT /": "replaceCart" },
  wishlist: { "GET /": "getWishlist", "PUT /": "replaceWishlist" },
  category: {
    "POST /": "createCategory", "GET /": "getCategories", "GET /tree": "getCategoryTree", "GET /sitemap": "getSitemapCategories", "GET /stats": "getCategoryStats",
    "GET /slug/:slug": "getCategoryBySlug", "GET /:id": "getCategoryById", "PUT /:id": "updateCategory",
    "DELETE /:id": "deleteCategory", "POST /:id/restore": "restoreCategory", "PATCH /bulk": "bulkUpdateCategories",
    "POST /bulk-delete": "bulkDeleteCategories", "POST /:parentId/subcategories": "createSubcategory",
    "GET /:parentId/subcategories": "getSubcategories", "PUT /:parentId/subcategories/reorder": "reorderSubcategories",
  },
  checkout: { "GET /active": "getActiveCheckout", "POST /": "createCheckout", "POST /:orderId/retry": "retryCheckout", "DELETE /:orderId": "cancelActiveCheckout" },
  contact: { "POST /submit": "submitContact" },
  coupon: { "GET /:code": "getCoupon", "POST /": "createCoupon", "PATCH /:couponId": "updateCoupon" },
  newsletter: { "POST /subscribe": "subscribe" },
  seo: { "GET /sitemap": "getPageSeoSitemap", "GET /:pageSlug": "getPageSeo" },
  order: { "GET /": "listMyOrders", "GET /:orderId": "getMyOrder", "PATCH /:orderId/status": "updateOrderStatus", "POST /:orderId/refunds": "createRefund", "POST /:orderId/emails/:emailEventId/resend": "resendEmail" },
  product: {
    "GET /": "listProducts", "GET /slug/:slug": "getBySlug", "GET /sitemap": "getSitemapProducts", "GET /category/:categorySlug": "getByCategorySlug",
    "GET /category/:categorySlug/subcategory/:subcategorySlug": "getByCategoryAndSubcategorySlug",
    "POST /": "createProduct", "PUT /:id": "updateProduct", "DELETE /:id": "softDeleteProduct",
  },
  review: { "GET /product/:productId": "listProductReviews", "POST /product/:productId": "createProductReview" },
  user: { "GET /profile": "getProfile", "PATCH /profile": "updateProfile" },
};

const intentionallyUnroutedControllers = {
  category: ["moveSubcategory"],
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

test("controller coverage includes every declared endpoint", () => {
  for (const [routeGroup, endpoints] of Object.entries(controllerHandlers)) {
    assert.deepEqual(Object.keys(endpoints).sort(), specs(expected[routeGroup]), `${routeGroup} controller coverage is incomplete`);
  }
});

test("every exported controller is covered by a route test", () => {
  const routedControllers = new Set(
    Object.entries(controllerHandlers).flatMap(([routeGroup, endpoints]) =>
      Object.values(endpoints).map((controllerName) => `${routeGroup}.${controllerName}`),
    ),
  );
  routedControllers.add("health.health");
  routedControllers.add("payment.cashfreeWebhook");

  for (const [controllerGroup, controller] of Object.entries(controllers)) {
    const unrouted = Object.keys(controller).filter((name) => !routedControllers.has(`${controllerGroup}.${name}`));
    assert.deepEqual(unrouted, intentionallyUnroutedControllers[controllerGroup] || [], `${controllerGroup} has an untested controller`);
  }
});

for (const [routeGroup, endpoints] of Object.entries(controllerHandlers)) {
  for (const [endpoint, controllerName] of Object.entries(endpoints)) {
    test(`${routeGroup} ${endpoint} uses ${controllerName}`, () => {
      const [method, path] = endpoint.split(" ");
      const handlers = routeHandlers(routeGroup, method.toLowerCase(), path);
      assert.equal(
        handlers.at(-1),
        controllers[routeGroup][controllerName],
        `${routeGroup} ${endpoint} must end at ${controllerName}`,
      );
    });
  }
}

test("health endpoint uses health controller", () => {
  const apiRoutes = require("../src/routes");
  assert.equal(getRoute(apiRoutes, "get", "/health").stack.at(-1).handle, controllers.health.health);
});

test("Cashfree webhook uses payment controller", () => {
  const webhook = app._router.stack.find((layer) => layer.route?.path === "/api/v1/payments/cashfree/webhook")?.route;
  assert.equal(webhook.stack.at(-1).handle, controllers.payment.cashfreeWebhook);
});

test("all private endpoints include authentication", () => {
  const privateRoutes = {
    address: expected.address,
    admin: expected.admin,
    checkout: expected.checkout,
    cart: expected.cart,
    wishlist: expected.wishlist,
    coupon: expected.coupon,
    order: expected.order,
    user: expected.user,
    auth: "POST /logout-all|POST /change-password",
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
    ["admin", "get", "/dashboard"], ["admin", "get", "/monitoring"], ["admin", "get", "/payments"], ["admin", "post", "/payments/:orderId/reconcile"], ["admin", "get", "/users"], ["admin", "patch", "/users/:id/role"], ["admin", "patch", "/users/:id/block"],
    ["category", "post", "/"], ["category", "get", "/stats"], ["category", "put", "/:id"], ["category", "delete", "/:id"], ["category", "post", "/:id/restore"], ["category", "patch", "/bulk"], ["category", "post", "/bulk-delete"], ["category", "post", "/:parentId/subcategories"], ["category", "put", "/:parentId/subcategories/reorder"],
    ["product", "post", "/"], ["product", "put", "/:id"], ["product", "delete", "/:id"], ["order", "patch", "/:orderId/status"], ["order", "post", "/:orderId/refunds"], ["order", "post", "/:orderId/emails/:emailEventId/resend"],
    ["coupon", "post", "/"], ["coupon", "patch", "/:couponId"],
  ];
  for (const [name, method, path] of adminRoutes) {
    const handlers = routeHandlers(name, method, path);
    assert.equal(handlers[0], auth, `${name} ${method} ${path} must authenticate first`);
    let error;
    handlers[1]({ user: { role: "user" } }, {}, (err) => { error = err; });
    assert.equal(error?.statusCode, 403, `${name} ${method} ${path} must require admin`);
  }
  assert.ok(routeHandlers("checkout", "post", "/").includes(checkoutLimiter), "checkout must be rate limited");
  assert.ok(routeHandlers("order", "post", "/:orderId/refunds").includes(refundLimiter), "refunds must be rate limited");
  assert.ok(routeHandlers("order", "post", "/:orderId/emails/:emailEventId/resend").includes(emailResendLimiter), "email resend must be rate limited");
});

test("the API index mounts every route group and health endpoint", () => {
  const index = require("../src/routes");
  const mounted = index.stack.filter((layer) => layer.name === "router").map((layer) => layer.regexp.toString());
  for (const prefix of ["categories", "product", "address", "contact", "reviews", "blogs", "checkout", "orders", "cart", "wishlist", "coupons", "newsletter", "seo", "auth", "users", "admin"]) {
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
