"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/services/auth/reset.service";
import { useToast } from "@/components/common/ToastContext";
import { userErrorMessage } from "@/utlis/error.utlis";
import styles from "./Login.module.css";

export default function ResetPassword() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const t = new URLSearchParams(window.location.hash.slice(1)).get("token");
    window.history.replaceState(null, "", window.location.pathname);
    if (t) setToken(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 8 || password.length > 16) {
      const msg = "Password must be between 8 and 16 characters";
      toast(msg, "warning");
      return;
    }
    if (password !== confirmPassword) {
      const msg = "Passwords do not match";
      toast(msg, "warning");
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(token, password);
      const msg = "Your password has been reset. You can now log in.";
      toast(msg, "success");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      const errMsg = userErrorMessage(err, "Reset failed. Please try again.");
      toast(errMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={`${styles.loginContainer} ${styles.authSingleColumn}`}>
      <div className={styles.loginLeft}>
        <div className={styles.loginFormWrapper}>
          <Link href="/" className={styles.homeLink}>← Back to shopping</Link>
          <div className={styles.loginHead}>
            <p className={styles.eyebrow}>Account security</p>
            <h1>Create a new password</h1>
            <p>Choose a secure password, then sign in with it.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label htmlFor="password">New Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={16}
                  required
                  disabled={isLoading}
                  style={{ paddingRight: "45px" }}
                />
                <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}><i className={`icon ${showPassword ? "icon-eye-hide-line" : "icon-eye"}`} /></button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="confirmPassword"
                  type={showConfirmation ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  maxLength={16}
                  required
                  disabled={isLoading}
                  style={{ paddingRight: "45px" }}
                />
                <button type="button" className={styles.passwordToggle} onClick={() => setShowConfirmation((value) => !value)} aria-label={showConfirmation ? "Hide confirmation password" : "Show confirmation password"}><i className={`icon ${showConfirmation ? "icon-eye-hide-line" : "icon-eye"}`} /></button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.loginBtn}
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>

    </section>
  );
}
