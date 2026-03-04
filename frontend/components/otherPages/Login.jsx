"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { login as loginService } from "@/services/auth/login.service";
import { loginStart, loginSuccess, loginFailure } from "@/redux/authSlice";
import { useToast } from "@/components/common/ToastContext";
import styles from "./Login.module.css";

export default function Login() {
  const [passwordType, setPasswordType] = useState("password");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
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
    setError("");
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      const msg = "Please fill in all fields";
      setError(msg);
      toast(msg, "warning");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      const msg = "Please enter a valid email address";
      setError(msg);
      toast(msg, "warning");
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      dispatch(loginStart());
      const response = await loginService(formData.email, formData.password);

      if (response.otpRequired) {
        // redirect to standalone OTP verification page
        router.push(
          `/otp-verification?email=${encodeURIComponent(formData.email)}`,
        );
      } else if (response.accessToken) {
        try {
          const me = await import("@/services/auth/me.service").then((m) =>
            m.getMe(),
          );
          dispatch(
            loginSuccess({
              user: me.data || response.user,
              token: response.accessToken,
            }),
          );
        } catch (meErr) {
          // fall back
          dispatch(
            loginSuccess({
              user: response.user,
              token: response.accessToken,
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
      const errorMessage = err?.message || "Login failed. Please try again.";
      setError(errorMessage);
      dispatch(loginFailure(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      {/* Left Side - Login Form */}
      <div className={styles.loginLeft}>
        <div className={styles.loginFormWrapper}>
          <div className={styles.loginHead}>
            <h2>Welcome Back!</h2>
            <p>Sign in to access your account and continue shopping</p>
          </div>

          {error && <div className={styles.alertError}>{error}</div>}

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
                <span
                  className={styles.passwordToggle}
                  onClick={togglePassword}
                  role="button"
                  tabIndex={0}
                >
                  {passwordType === "password" ? "👁️" : "👁️‍🗨️"}
                </span>
              </div>
            </div>

            <div className={styles.formOptions}>
              <label className={styles.checkboxWrapper}>
                <input type="checkbox" defaultChecked />
                <span>Remember me</span>
              </label>
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

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          <div className={styles.socialLogin}>
            <button className={styles.socialBtn} type="button">
              <span>🔵</span>
              Continue with Google
            </button>
            <button className={styles.socialBtn} type="button">
              <span>🍎</span>
              Continue with Apple
            </button>
          </div>

          <div className={styles.signupPrompt}>
            Don't have an account? <Link href="/register">Sign Up</Link>
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
