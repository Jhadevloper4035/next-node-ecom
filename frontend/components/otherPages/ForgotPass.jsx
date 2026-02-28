"use client";
import React, { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/services/auth/forgot.service";
import { useToast } from "@/components/common/ToastContext";

export default function ForgotPass() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      const msg = "Please enter a valid email address";
      setError(msg);
      toast(msg, "warning");
      setIsLoading(false);
      return;
    }

    try {
      await forgotPassword(email);
      const msg = "If the email exists, you'll receive a reset link shortly.";
      setMessage(msg);
      toast(msg, "info");
    } catch (err) {
      const errMsg = err?.message || "Failed to send email. Please try again.";
      setError(errMsg);
      toast(errMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flat-spacing">
      <div className="container">
        <div className="login-wrap">
          <div className="left">
            <div className="heading">
              <h4 className="mb_8">Reset your password</h4>
              <p>We will send you an email to reset your password</p>
            </div>
            <form onSubmit={handleSubmit} className="form-login">
              <div className="wrap">
                <fieldset className="">
                  <input
                    className=""
                    type="email"
                    placeholder="Username or email address*"
                    name="email"
                    tabIndex={2}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-required="true"
                    required
                  />
                </fieldset>
              </div>
              <div className="button-submit">
                <button className="tf-btn btn-fill" type="submit">
                  <span className="text text-button">Submit</span>
                </button>
              </div>
              {message && <p className="text-success mt-2">{message}</p>}
              {error && <p className="text-danger mt-2">{error}</p>}
            </form>
          </div>
          <div className="right">
            <h4 className="mb_8">New Customer</h4>
            <p className="text-secondary">
              Be part of our growing family of new customers! Join us today and
              unlock a world of exclusive benefits, offers, and personalized
              experiences.
            </p>
            <Link href={`/register`} className="tf-btn btn-fill">
              <span className="text text-button">Register</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
