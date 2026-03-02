// validators/address.validator.js
const { body, param } = require("express-validator");
const mongoose = require("mongoose");
const Address = require("../models/address.model");

// ================= PARAM VALIDATOR =================

const addressIdParam = [
    param("addressId")
        .custom((v) => mongoose.Types.ObjectId.isValid(v))
        .withMessage("Invalid addressId."),
];

// ================= CREATE VALIDATOR =================

const createAddressValidator = [
    // max 5 active addresses (business rule)
    body().custom(async (_, { req }) => {
        const userId = req.user?.id;
        const activeCount = await Address.countDocuments({
            user: userId,
            isActive: true,
        });

        if (activeCount >= 5) {
            throw new Error("You can only store up to 5 active addresses.");
        }

        return true;
    }),

    body("label")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 30 })
        .withMessage("Label must be max 30 characters."),

    body("fullName")
        .notEmpty()
        .trim()
        .withMessage("Full name is required."),

    body("phone")
        .notEmpty()
        .trim()
        .matches(/^[0-9]{10}$/)
        .withMessage("Phone must be a valid 10-digit number."),

    body("alternatePhone")
        .optional({ nullable: true })
        .trim()
        .matches(/^[0-9]{10}$/)
        .withMessage("Alternate phone must be a valid 10-digit number."),

    body("line1")
        .notEmpty()
        .trim()
        .withMessage("Address line1 is required."),

    body("line2")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 200 })
        .withMessage("Line2 must be max 200 characters."),

    body("landmark")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 80 })
        .withMessage("Landmark must be max 80 characters."),

    body("city")
        .notEmpty()
        .trim()
        .withMessage("City is required."),

    body("state")
        .notEmpty()
        .trim()
        .withMessage("State is required."),

    body("country")
        .optional()
        .equals("India")
        .withMessage("Country must be India."),

    body("postalCode")
        .notEmpty()
        .trim()
        .matches(/^[0-9]{6}$/)
        .withMessage("Postal code must be a valid 6-digit PIN code."),

    body("isDefault")
        .optional()
        .isBoolean()
        .withMessage("isDefault must be boolean."),

    // Strict whitelist (security best practice)
    body().custom((_, { req }) => {
        const allowed = new Set([
            "label",
            "fullName",
            "phone",
            "alternatePhone",
            "line1",
            "line2",
            "landmark",
            "city",
            "state",
            "country",
            "postalCode",
            "isDefault",
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

// ================= UPDATE VALIDATOR =================

const updateAddressValidator = [
    ...addressIdParam,

    body("label")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 30 })
        .withMessage("Label must be max 30 characters."),

    body("fullName")
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Full name cannot be empty."),

    body("phone")
        .optional()
        .trim()
        .matches(/^[0-9]{10}$/)
        .withMessage("Phone must be a valid 10-digit number."),

    body("alternatePhone")
        .optional({ nullable: true })
        .trim()
        .matches(/^[0-9]{10}$/)
        .withMessage("Alternate phone must be valid 10-digit number."),

    body("line1")
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage("Line1 cannot be empty."),

    body("line2")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 200 })
        .withMessage("Line2 must be max 200 characters."),

    body("landmark")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 80 })
        .withMessage("Landmark must be max 80 characters."),

    body("city")
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage("City cannot be empty."),

    body("state")
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage("State cannot be empty."),

    body("country")
        .optional()
        .equals("India")
        .withMessage("Country must be India."),

    body("postalCode")
        .optional()
        .trim()
        .matches(/^[0-9]{6}$/)
        .withMessage("Postal code must be valid 6-digit PIN."),

    body("isDefault")
        .optional()
        .isBoolean()
        .withMessage("isDefault must be boolean."),
];

// ================= DELETE & DEFAULT =================

const deleteAddressValidator = [...addressIdParam];
const setDefaultAddressValidator = [...addressIdParam];

module.exports = {
    createAddressValidator,
    updateAddressValidator,
    deleteAddressValidator,
    setDefaultAddressValidator,
};