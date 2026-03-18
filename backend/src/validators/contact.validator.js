const { body } = require("express-validator");

// ================= CREATE CONTACT =================

exports.createContactValidator = [
    body("name")
        .notEmpty()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters."),

    body("email")
        .notEmpty()
        .trim()
        .isEmail()
        .withMessage("Valid email is required."),

    body("mobileNumber")
        .notEmpty()
        .trim()
        .matches(/^[0-9]{10}$/)
        .withMessage("Mobile number must be a valid 10-digit number."),

    body("message")
        .notEmpty()
        .trim()
        .isLength({ min: 5, max: 1000 })
        .withMessage("Message must be between 5 and 1000 characters."),

    // ================= STRICT WHITELIST =================
    body().custom((_, { req }) => {
        const allowed = new Set([
            "name",
            "email",
            "mobileNumber",
            "message",
        ]);

        const unknownFields = Object.keys(req.body || {}).filter(
            (key) => !allowed.has(key)
        );

        if (unknownFields.length > 0) {
            throw new Error(`Unknown fields: ${unknownFields.join(", ")}`);
        }

        return true;
    }),
];