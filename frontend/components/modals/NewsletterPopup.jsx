"use client";

import { useEffect, useState } from "react";
import { subscribeToNewsletter } from "@/services/newsletter/newsletter.service";

const modalId = "newsletterPopup";
const dismissedKey = "newsletter-popup-session-dismissed";

export default function NewsletterPopup() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const element = document.getElementById(modalId);
    if (!element || window.sessionStorage.getItem(dismissedKey)) return undefined;

    const bootstrap = require("bootstrap");
    const timer = window.setTimeout(() => bootstrap.Modal.getOrCreateInstance(element).show(), 1500);
    const rememberDismissal = () => window.sessionStorage.setItem(dismissedKey, "true");

    element.addEventListener("hidden.bs.modal", rememberDismissal);
    return () => {
      window.clearTimeout(timer);
      element.removeEventListener("hidden.bs.modal", rememberDismissal);
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await subscribeToNewsletter(email);
      setMessage(response.message);
      setEmail("");
    } catch (error) {
      setMessage(error?.message || "Unable to subscribe right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal fade modal-newleter" id={modalId} tabIndex="-1" aria-labelledby={`${modalId}Title`} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-top newsletter-popup-image">
            <img src="/images/banner/banner1.png" alt="Curve & Comfort living room" />
          </div>
          <div className="modal-bottom text-center">
            <p className="text-caption-1">CURVE &amp; COMFORT</p>
            <h5 id={`${modalId}Title`}>Join our newsletter</h5>
            <p>New arrivals and design inspiration, delivered occasionally.</p>
            <form onSubmit={handleSubmit}>
              <label className="visually-hidden" htmlFor="newsletter-email">Email address</label>
              <input id="newsletter-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" autoComplete="email" required />
              <button className="tf-btn btn-fill" type="submit" disabled={isSubmitting}>{isSubmitting ? "Subscribing..." : "Subscribe"}</button>
            </form>
            {message && <p className="mt-3 mb-0" role="status">{message}</p>}
          </div>
          <button type="button" className="newsletter-popup-dismiss" data-bs-dismiss="modal" aria-label="Close">×</button>
        </div>
      </div>
    </div>
  );
}
