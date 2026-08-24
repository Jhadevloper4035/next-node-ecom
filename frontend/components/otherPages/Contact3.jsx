"use client";
import React, { useRef, useState } from "react";
import { submitContact } from "@/services/contact/contact.service";
import { useRouter } from "next/navigation";
export default function Contact3() {
  const router = useRouter();
  const formRef = useRef();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendMail = async (e) => {
    e.preventDefault();

    const formData = new FormData(formRef.current);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      mobileNumber: String(formData.get("phone") || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await submitContact(payload);
      formRef.current.reset();
      router.push("/contact-success");
    } catch (error) {
      setErrorMessage(error?.message || "Unable to send your enquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact-form-section flat-spacing">
      <div className="container">
        <div className="heading-section text-center">
          <h3 className="heading">Get In Touch</h3>
          <p className="subheading">
            Use the form below to get in touch with the sales team
          </p>
        </div>

        {errorMessage && <p className="text-center text-danger mb-3" role="alert">{errorMessage}</p>}

        <form
          onSubmit={sendMail}
          ref={formRef}
          id="contactform"
          className="form-leave-comment"
        >
          <div className="wrap">
            <div className="cols">
              <fieldset>
                <input
                  type="text"
                  placeholder="Your Name*"
                  name="name"
                  id="name"
                  required
                />
              </fieldset>

              <fieldset>
                <input
                  type="email"
                  placeholder="Your Email*"
                  name="email"
                  id="email"
                  required
                />
              </fieldset>
            </div>

            <div className="cols">
              <fieldset>
                <input
                  type="tel"
                  placeholder="Your Phone*"
                  name="phone"
                  required
                />
              </fieldset>
              <fieldset>
                <input
                  type="text"
                  placeholder="Subject*"
                  name="subject"
                  required
                />
              </fieldset>
            </div>

            <fieldset>
              <textarea
                name="message"
                id="message"
                rows={4}
                placeholder="Your Message*"
                required
              />
            </fieldset>
          </div>

          <div className="button-submit send-wrap">
            <button className="tf-btn btn-fill" type="submit" disabled={isSubmitting}>
              <span className="text text-button">{isSubmitting ? "Sending..." : "Send message"}</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
