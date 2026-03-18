"use client";
import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";

export default function Contact2() {
  const formRef = useRef();
  const [success, setSuccess] = useState(true);
  const [showMessage, setShowMessage] = useState(false);

  const handleShowMessage = () => {
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
    }, 2000);
  };

  const sendMail = (e) => {
    e.preventDefault();

    emailjs
      .sendForm("service_noj8796", "template_fs3xchn", formRef.current, {
        publicKey: "iG4SCmR-YtJagQ4gV",
      })
      .then((res) => {
        if (res.status === 200) {
          setSuccess(true);
          handleShowMessage();
          formRef.current.reset();
        } else {
          setSuccess(false);
          handleShowMessage();
        }
      })
      .catch((err) => {
        console.log(err);
        setSuccess(false);
        handleShowMessage();
      });
  };

  return (
    <section className="flat-spacing">
      <div className="container">
        <div className="contact-us-content">
          <div className="left">
            <h4>Get In Touch</h4>
            <p className="text-secondary-2">
              Use the form below to get in touch with the sales team
            </p>

            <div
              className={`tfSubscribeMsg footer-sub-element ${
                showMessage ? "active" : ""
              }`}
            >
              {success ? (
                <p style={{ color: "rgb(52, 168, 83)" }}>
                  Message Sent Successfully
                </p>
              ) : (
                <p style={{ color: "red" }}>Something went wrong</p>
              )}
            </div>

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
                      pattern="[6-9]{1}[0-9]{9}"
                      title="Enter valid Indian phone number"
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
                <button className="tf-btn btn-fill" type="submit">
                  <span className="text text-button">Send message</span>
                </button>
              </div>
            </form>
          </div>

          <div className="right">
            <h4>Information</h4>

            <div className="mb_20">
              <div className="text-title mb_8">Phone:</div>
              <p className="text-secondary">+91 98765 14240</p>
            </div>

            <div className="mb_20">
              <div className="text-title mb_8">Email:</div>
              <p className="text-secondary">support@yourcompany.in</p>
            </div>

            <div className="mb_20">
              <div className="text-title mb_8">Address:</div>
              <p className="text-secondary">
                Prahlad Nagar, Ahmedabad, Gujarat 380015, India
              </p>
            </div>

            <div>
              <div className="text-title mb_8">Open Time:</div>

              <p className="mb_4 open-time">
                <span className="text-secondary">Mon - Sat:</span> 10:00 AM -
                7:00 PM IST
              </p>

              <p className="open-time">
                <span className="text-secondary">Sunday:</span> Closed
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}