const GENERIC_ERROR = "Something went wrong. Please try again later.";

export const userErrorMessage = (error, fallback = GENERIC_ERROR) => {
  const message = typeof error === "string" ? error : error?.message;
  if (
    error?.status >= 500 ||
    message === "Validation failed" ||
    /User validation failed|\$2[aby]\$|SMTP|Mongo|Mongoose|Cast to|E11000/i.test(message || "")
  ) {
    return GENERIC_ERROR;
  }
  return message || fallback;
};
