const Contact = require("../models/contact.model");
const logger = require("../config/logger");

// ================= CREATE CONTACT =================

exports.submitContact = async (req, res) => {
  try {
    const { name, email, mobileNumber, subject, message } = req.body;

    const contact = await Contact.create({
      name,
      email,
      mobileNumber,
      subject,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Your query has been submitted successfully.",
      data: contact,
    });

  } catch (error) {
    (req.log || logger).error({ err: error, event: "contact_submit_failed" }, "Contact submit failed");

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};
