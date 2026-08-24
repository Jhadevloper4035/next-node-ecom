const { body } = require("express-validator");

exports.subscribeValidator = [
  body("email").isEmail().normalizeEmail().withMessage("A valid email is required."),
  body().custom((_, { req }) => {
    const fields = Object.keys(req.body || {});
    if (fields.some((field) => field !== "email")) throw new Error("Unknown fields are not allowed.");
    return true;
  }),
];
