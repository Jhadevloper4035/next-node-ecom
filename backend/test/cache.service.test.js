const test = require("node:test");
const assert = require("node:assert/strict");

process.env.MONGODB_URI ||= "mongodb+srv://<db_username>:<db_password>@curve-and-comfort.lvwb3ba.mongodb.net/ecomerce-development?retryWrites=true&w=majority&appName=curve-and-comfort";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";
delete process.env.REDIS_URL;

const { stableStringify } = require("../src/services/cache.service");

test("stableStringify produces the same value for reordered object keys", () => {
  const first = stableStringify({
    query: { limit: 10, page: 1, filters: { sort: "newest", active: true } },
    params: {},
  });
  const second = stableStringify({
    params: {},
    query: { filters: { active: true, sort: "newest" }, page: 1, limit: 10 },
  });

  assert.equal(first, second);
});

test("stableStringify preserves array ordering", () => {
  assert.notEqual(
    stableStringify({ tags: ["sofa", "sale"] }),
    stableStringify({ tags: ["sale", "sofa"] }),
  );
});
