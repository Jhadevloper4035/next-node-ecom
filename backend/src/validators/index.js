
// middlewares/validate.js
const { validationResult } = require("express-validator");
const { sendError } = require("../helper/request")

module.exports = function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, errors.array()[0].msg, 400);
    }
    next();
};

