const mongoose = require("mongoose");

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    source: {
      type: String,
      default: "popup",
    },
  },
  { timestamps: true, collection: "newsletter_subscribers" },
);

module.exports = mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);
