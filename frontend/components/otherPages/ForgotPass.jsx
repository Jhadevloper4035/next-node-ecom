"use client";
import React, { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/services/auth/forgot.service";
import { useToast } from "@/components/common/ToastContext";
import styles from "./Login.module.css";

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
    <div className={styles.loginContainer}>
      <div className={styles.loginLeft}>
        <div className={styles.loginFormWrapper}>
          <div className={styles.loginHead}>
            <h2>Reset your password</h2>
            <p>We will send you an email to reset your password</p>
          </div>

          {error && <div className={styles.alertError}>{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

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
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          </form>

          <div className={styles.signupPrompt}>
            Remembered your password? <Link href="/login">Sign In</Link>
          </div>
        </div>
      </div>

      {/* Right Side - Furniture Image */}
      <div className={styles.loginRight}>
        <img
          src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=900&fit=crop"
          alt="Premium furniture"
          className={styles.loginRightImage}
        />
      </div>
    </div>
  );
}
