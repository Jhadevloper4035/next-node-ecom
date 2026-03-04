"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { register as registerService } from "@/services/auth/register.service";
import { loginStart, loginSuccess, loginFailure } from "@/redux/authSlice";
import { useToast } from "@/components/common/ToastContext";
import styles from "./Login.module.css";

export default function Register() {
  const [passwordType, setPasswordType] = useState("password");
  const [confirmPasswordType, setConfirmPasswordType] = useState("password");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobileNumber: "",
    agreeToTerms: false,
  });
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

  const toggleConfirmPassword = () => {
    setConfirmPasswordType((prevType) =>
      prevType === "password" ? "text" : "password",
    );
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const validateForm = () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.mobileNumber ||
      !formData.password
    ) {
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

    if (formData.password.length < 8) {
      const msg = "Password must be at least 8 characters long";
      setError(msg);
      toast(msg, "warning");
      return false;
    }

    if (!formData.agreeToTerms) {
      const msg = "Please agree to the terms and conditions";
      setError(msg);
      toast(msg, "warning");
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      dispatch(loginStart());
      const response = await registerService(
        formData.fullName,
        formData.email,
        formData.password,
        formData.mobileNumber,
      );

      toast("Registration initiated, please verify your email", "info");
      setTimeout(() => {
        router.push(
          `/otp-verification?email=${encodeURIComponent(formData.email)}`,
        );
      }, 100);
    } catch (err) {
      const errorMessage =
        err?.message || "Registration failed. Please try again.";
      setError(errorMessage);
      dispatch(loginFailure(errorMessage));
      toast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginLeft}>
        <div className={styles.loginFormWrapper}>
          <div className={styles.loginHead}>
            <h2>Create Account</h2>
            <p>Sign up to start shopping</p>
          </div>

          {error && <div className={styles.alertError}>{error}</div>}

          <form onSubmit={handleRegister} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
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
                  name="password"
                  placeholder="Enter your password"
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

            <div className={styles.formGroup}>
              <label htmlFor="mobileNumber">Mobile Number</label>
              <input
                id="mobileNumber"
                type="text"
                name="mobileNumber"
                placeholder="Enter your phone number"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <span>
                  I agree to the <Link href="/term-of-use">Terms of Use</Link>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className={styles.loginBtn}
              disabled={isLoading}
            >
              {isLoading ? "Signing up..." : "Register"}
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
            Already have an account? <Link href="/login">Sign In</Link>
          </div>
        </div>
      </div>

      {/* Right Side - Furniture Image */}
      <div className={styles.loginRight}>
        <img
          src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=1500&fit=crop"
          alt="Premium furniture"
          className={styles.loginRightImage}
        />
      </div>
    </div>
  );
}
