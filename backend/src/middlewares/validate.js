const ApiError = require("../utils/ApiError");

function validate(schema, property = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true, convert: true });
    if (error) return next(new ApiError(400, "Validation error", error.details.map(d => d.message)));
    req[property] = value;
    next();
  };
}

module.exports = validate;
