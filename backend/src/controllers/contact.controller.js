const Contact = require("../models/contact.model");

// ================= CREATE CONTACT =================

exports.submitContact = async (req, res) => {
  try {
    const { name, email, mobileNumber, message } = req.body;

    // Optional: attach user if logged in
    const userId = req.user?.id || null;

    const contact = await Contact.create({
      name,
      email,
      mobileNumber,
      message,
        
    });

    return res.status(201).json({
      success: true,
      message: "Your query has been submitted successfully.",
      data: contact,
    });

  } catch (error) {
    console.error("Contact Submit Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};