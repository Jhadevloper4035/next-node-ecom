process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";

const assert = require("node:assert/strict");
const test = require("node:test");
const { validationResult } = require("express-validator");
const { createContactValidator } = require("../src/validators/contact.validator");

async function validateContact(body) {
  const req = { body };
  await Promise.all(createContactValidator.map((rule) => rule.run(req)));
  return validationResult(req);
}

const contact = {
  name: "Jane 😊 O'Connor",
  email: "jane@example.com",
  mobileNumber: "9876543210",
  subject: "Sofa — 3+2 & custom!",
  message: "Please share the delivery timeline for the 🛋️ set.",
};

test("contact submissions accept emoji and punctuation", async () => {
  assert.equal((await validateContact(contact)).isEmpty(), true);
  assert.equal((await validateContact({ ...contact, subject: "" })).isEmpty(), false);
});
