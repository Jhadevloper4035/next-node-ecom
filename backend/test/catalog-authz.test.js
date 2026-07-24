process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";

const test = require("node:test");
const assert = require("node:assert/strict");
const productRoutes = require("../src/routes/product.route");
const categoryRoutes = require("../src/routes/category.route");
const auth = require("../src/middlewares/auth");

const route = (router, method, path) => router.stack.find((layer) =>
  layer.route?.path === path && layer.route.methods[method]
).route.stack.map((layer) => layer.handle);

test("catalog writes require an admin user", () => {
  const protectedRoutes = [
    route(productRoutes, "post", "/"),
    route(productRoutes, "put", "/:id"),
    route(productRoutes, "delete", "/:id"),
    route(categoryRoutes, "post", "/"),
    route(categoryRoutes, "get", "/stats"),
    route(categoryRoutes, "put", "/:id"),
    route(categoryRoutes, "delete", "/:id"),
    route(categoryRoutes, "post", "/:id/restore"),
    route(categoryRoutes, "patch", "/bulk"),
    route(categoryRoutes, "post", "/bulk-delete"),
    route(categoryRoutes, "post", "/:parentId/subcategories"),
    route(categoryRoutes, "put", "/:parentId/subcategories/reorder"),
  ];

  for (const handlers of protectedRoutes) {
    assert.equal(handlers[0], auth);

    let error;
    handlers[1]({ user: { role: "user" } }, {}, (err) => { error = err; });
    assert.equal(error?.statusCode, 403);
  }
});
