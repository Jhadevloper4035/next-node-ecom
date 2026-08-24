const NewsletterSubscriber = require("../models/newsletterSubscriber.model");

exports.subscribe = async (req, res, next) => {
  try {
    const subscriber = await NewsletterSubscriber.findOneAndUpdate(
      { email: req.body.email },
      { $setOnInsert: { email: req.body.email, source: "popup" } },
      { new: true, upsert: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Thanks for subscribing.",
      data: { email: subscriber.email },
    });
  } catch (error) {
    return next(error);
  }
};
