const sensitiveKey = /(?:cvv|cvc|card.*(?:number|pan)|(?:^|_)pan(?:_|$)|otp|(?:^|_)pin(?:_|$)|token|signature|secret|authorization|payment_session_id)/i;

function redactSensitivePaymentData(value) {
  if (Array.isArray(value)) return value.map(redactSensitivePaymentData);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sensitiveKey.test(key) ? "[REDACTED]" : redactSensitivePaymentData(item)]));
}

function redactPaymentPayload(rawPayload) {
  try {
    return JSON.stringify(redactSensitivePaymentData(JSON.parse(rawPayload)));
  } catch {
    return "[unparseable payload]";
  }
}

function redactPaymentData(data) {
  return JSON.stringify(redactSensitivePaymentData(data));
}

module.exports = { redactPaymentPayload, redactPaymentData };
