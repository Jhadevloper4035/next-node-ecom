"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { register as registerService } from "@/services/auth/register.service";
import { loginStart, loginFailure } from "@/redux/authSlice";
import { useToast } from "@/components/common/ToastContext";
import { userErrorMessage } from "@/utlis/error.utlis";
import styles from "./Login.module.css";

export default function Register() {
  const [passwordType, setPasswordType] = useState("password");
  const [confirmPasswordType, setConfirmPasswordType] = useState("password");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobileNumber: "",
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
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
  };

  const validateForm = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.mobileNumber ||
      !formData.password
    ) {
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

    if (formData.password.length < 8 || formData.password.length > 16) {
      const msg = "Password must be between 8 and 16 characters";
      toast(msg, "warning");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      const msg = "Passwords do not match";
      toast(msg, "warning");
      return false;
    }

    if (!formData.agreeToTerms) {
      const msg = "Please agree to the terms and conditions";
      toast(msg, "warning");
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      dispatch(loginStart());
      await registerService(
        `${formData.firstName} ${formData.lastName}`.trim(),
        formData.email,
        formData.password,
        formData.mobileNumber,
      );

      toast("Check your email for the verification link", "info");
      setTimeout(() => {
        router.push("/login");
      }, 100);
    } catch (err) {
      const errorMessage = userErrorMessage(err, "Registration failed. Please try again.");
      dispatch(loginFailure(errorMessage));
      toast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={`${styles.loginContainer} ${styles.registerContainer} ${styles.authSingleColumn}`}>
      <div className={styles.loginLeft}>
        <div className={`${styles.loginFormWrapper} ${styles.registerCard}`}>
          <div className={styles.registerTopline}>
            <Link href="/" className={styles.homeLink}>← Back to shopping</Link>
            <span>Already a member? <Link href="/login">Sign in</Link></span>
          </div>
          <div className={styles.loginHead}>
            <h1>Create your account</h1>
            <p>Enjoy a faster checkout and keep your favourites in one place.</p>
          </div>

          <form onSubmit={handleRegister} className={`${styles.loginForm} ${styles.registerForm}`}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Your email address"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                autoComplete="email"
                required
              />
            </div>

            <div className={styles.formRow}>
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
                    minLength={8}
                    maxLength={16}
                    autoComplete="new-password"
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

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="confirmPassword"
                    type={confirmPasswordType}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    minLength={8}
                    maxLength={16}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={toggleConfirmPassword}
                    aria-label={confirmPasswordType === "password" ? "Show confirmation password" : "Hide confirmation password"}
                  >
                    <i className={`icon ${confirmPasswordType === "password" ? "icon-eye" : "icon-eye-hide-line"}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="mobileNumber">Phone Number</label>
              <input
                id="mobileNumber"
                type="text"
                name="mobileNumber"
                placeholder="Enter a 10–15 digit number"
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

        </div>
      </div>
    </section>
  );
}
