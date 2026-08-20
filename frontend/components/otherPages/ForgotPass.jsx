"use client";
import React, { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/services/auth/forgot.service";
import { useToast } from "@/components/common/ToastContext";
import { userErrorMessage } from "@/utlis/error.utlis";
import styles from "./Login.module.css";

export default function ForgotPass() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      const msg = "Please enter a valid email address";
      toast(msg, "warning");
      setIsLoading(false);
      return;
    }

    try {
      await forgotPassword(email);
      const msg = "If the email exists, you'll receive a reset link shortly.";
      toast(msg, "info");
    } catch (err) {
      const errMsg = userErrorMessage(err, "Failed to send email. Please try again.");
      toast(errMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={`${styles.loginContainer} ${styles.authSingleColumn}`}>
      <div className={styles.loginLeft}>
        <div className={styles.loginFormWrapper}>
          <div className={styles.loginHead}>
            <h1>Forgot your password?</h1>
            <p>Enter your email and we’ll send a secure reset link.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className={styles.loginBtn}
              disabled={isLoading}
            >
              <i className="icon icon-mail" aria-hidden="true" />
              <span>{isLoading ? "Submitting..." : "Submit"}</span>
            </button>
          </form>

          <div className={styles.signupPrompt}>
            Remembered your password? <Link href="/login">Sign In</Link>
          </div>
        </div>
      </div>

    </section>
  );
}
