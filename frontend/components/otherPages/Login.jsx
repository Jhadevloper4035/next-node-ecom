"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { login as loginService } from "@/services/auth/login.service";
import { resendVerification } from "@/services/auth/resend-verification.service";
import { loginStart, loginSuccess, loginFailure } from "@/redux/authSlice";
import { useToast } from "@/components/common/ToastContext";
import { userErrorMessage } from "@/utlis/error.utlis";
import styles from "./Login.module.css";

export default function Login() {
  const [passwordType, setPasswordType] = useState("password");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const toast = useToast();

  const togglePassword = () => {
    setPasswordType((prevType) =>
      prevType === "password" ? "text" : "password",
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setNeedsVerification(false);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      const msg = "Please fill in all fields";
      toast(msg, "warning");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      const msg = "Please enter a valid email address";
      toast(msg, "warning");
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setNeedsVerification(false);

    try {
      dispatch(loginStart());
      const response = await loginService(formData.email, formData.password);

      if (response.user) {
        try {
          const me = await import("@/services/user/me.service").then((m) =>
            m.getMe(),
          );
          dispatch(
            loginSuccess({
              user: me.data || response.user,
            }),
          );
        } catch (meErr) {
          // fall back
          dispatch(
            loginSuccess({
              user: response.user,
            }),
          );
        }
        // wait for state update and storage write before redirecting
        toast("Logged in successfully", "success");
        setTimeout(() => {
          router.push("/");
        }, 200);
      }
    } catch (err) {
      const errorMessage = userErrorMessage(err, "Login failed. Please try again.");
      setNeedsVerification(errorMessage.toLowerCase().includes("verify your email"));
      dispatch(loginFailure(errorMessage));
      toast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) return toast("Enter your email address first.", "warning");
    setIsResending(true);
    try {
      await resendVerification(formData.email);
      toast("If this account needs verification, a new link has been sent.", "info");
    } catch (err) {
      toast(userErrorMessage(err, "Could not resend the verification link."), "error");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <section className={`${styles.loginContainer} ${styles.authSingleColumn}`}>
      <div className={styles.loginLeft}>
        <div className={styles.loginFormWrapper}>
          <Link href="/" className={styles.homeLink}>← Back to shopping</Link>
          <div className={styles.loginHead}>
            <p className={styles.eyebrow}>Your Curve & Comfort account</p>
            <h1>Welcome back</h1>
            <p>Sign in to continue furnishing your space.</p>
          </div>

          {needsVerification && (
            <button type="button" className={styles.forgotPassword} onClick={handleResendVerification} disabled={isResending}>
              {isResending ? "Sending verification link..." : "Resend verification link"}
            </button>
          )}

          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  type={passwordType}
                  placeholder="Enter your password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                  style={{ paddingRight: "45px" }}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={togglePassword}
                  aria-label={passwordType === "password" ? "Show password" : "Hide password"}
                >
                  <i className={`icon ${passwordType === "password" ? "icon-eye" : "icon-eye-hide-line"}`} />
                </button>
              </div>
            </div>

            <div className={styles.formOptions}>
              <Link href="/forget-password" className={styles.forgotPassword}>
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className={styles.loginBtn}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className={styles.signupPrompt}>
            Don't have an account? <Link href="/register">Sign Up</Link>
          </div>
        </div>
      </div>

    </section>
  );
}
