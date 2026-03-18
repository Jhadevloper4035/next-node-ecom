"use client";
import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";

export default function Contact1() {
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
    <section className="flat-spacing pt-0">
      <div className="container">
        <div className="heading-section text-center">
          <h3 className="heading">Get In Touch</h3>
          <p className="subheading">
            Use the form below to get in touch with the sales team
          </p>
        </div>

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

        <form onSubmit={sendMail} ref={formRef} className="form-leave-comment">
          <div className="wrap">
            <div className="cols">
              <fieldset>
                <input
                  type="text"
                  placeholder="Your Name*"
                  name="name"
                  required
                />
              </fieldset>

              <fieldset>
                <input
                  type="email"
                  placeholder="Your Email*"
                  name="email"
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
                rows={4}
                placeholder="Your Message*"
                name="message"
                required
              />
            </fieldset>
          </div>

          <div className="button-submit text-center">
            <button className="tf-btn btn-fill" type="submit">
              <span className="text text-button">Send message</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}