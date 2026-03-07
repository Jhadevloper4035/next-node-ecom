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
              <svg
                width="20px"
                height="20px"
                viewBox="-3 0 266 266"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid"
                fill="#000000"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  <path
                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                    fill="#4285F4"
                  ></path>
                  <path
                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                    fill="#34A853"
                  ></path>
                  <path
                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                    fill="#FBBC05"
                  ></path>
                  <path
                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                    fill="#EB4335"
                  ></path>
                </g>
              </svg>
              Continue with Google
            </button>
            <button className={styles.socialBtn} type="button">
              <svg
                fill="#000000"
                width="23px"
                height="23px"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"></path>{" "}
                </g>
              </svg>
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
