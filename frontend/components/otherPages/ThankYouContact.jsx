import React from "react";
import Link from "next/link";

export default function ThankYouContact() {
  return (
    <section className="flat-spacing pt-5">
      <div className="container">
        <div className="heading-section text-center">
          <h3 className="heading">Thank You!</h3>
          <p className="subheading mb-4">
            Your message has been successfully sent. We will get back to you shortly.
          </p>
          <div className="button-submit text-center mt-5" style={{ display: 'flex', justifyContent: 'center' }}>
            <Link className="tf-btn btn-fill" href="/">
              <span className="text text-button">Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
