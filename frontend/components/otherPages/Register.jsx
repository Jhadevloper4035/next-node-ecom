"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { register as registerService } from "@/services/auth/register.service";
import { loginStart, loginSuccess, loginFailure } from "@/redux/authSlice";
import { useToast } from "@/components/common/ToastContext";

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
      !formData.password ||
      !formData.confirmPassword
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

    if (formData.password !== formData.confirmPassword) {
      const msg = "Passwords do not match";
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

      // backend will always send an OTP and no token/data on register;
      // navigate to verification page regardless of response content
      console.log("register response", response);
      // wait for any state updates before redirecting
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
    <section className="flat-spacing">
      <div className="container">
        <div className="login-wrap">
          <div className="left">
            <div className="heading">
              <h4>Register</h4>
            </div>
            <form
              onSubmit={handleRegister}
              className="form-login form-has-password"
            >
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <div className="wrap">
                <fieldset className="">
                  <input
                    className=""
                    type="text"
                    placeholder="Full Name*"
                    name="fullName"
                    tabIndex={1}
                    value={formData.fullName}
                    onChange={handleInputChange}
                    aria-required="true"
                    disabled={isLoading}
                    required
                  />
                </fieldset>
                <fieldset className="">
                  <input
                    className=""
                    type="email"
                    placeholder="Email address*"
                    name="email"
                    tabIndex={2}
                    value={formData.email}
                    onChange={handleInputChange}
                    aria-required="true"
                    disabled={isLoading}
                    required
                  />
                </fieldset>
                <fieldset className="position-relative password-item">
                  <input
                    className="input-password"
                    type={passwordType}
                    placeholder="Password*"
                    name="password"
                    tabIndex={2}
                    value={formData.password}
                    onChange={handleInputChange}
                    aria-required="true"
                    disabled={isLoading}
                    required
                  />
                  <span
                    className={`toggle-password ${
                      !(passwordType === "text") ? "unshow" : ""
                    }`}
                    onClick={togglePassword}
                  >
                    <i
                      className={`icon-eye-${
                        !(passwordType === "text") ? "hide" : "show"
                      }-line`}
                    />
                  </span>
                </fieldset>

                <fieldset className="position-relative password-item">
                  <input
                    className="input-password"
                    type={confirmPasswordType}
                    placeholder="Confirm Password*"
                    name="confirmPassword"
                    tabIndex={2}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    aria-required="true"
                    disabled={isLoading}
                    required
                  />
                  <span
                    className={`toggle-password ${
                      !(confirmPasswordType === "text") ? "unshow" : ""
                    }`}
                    onClick={toggleConfirmPassword}
                  >
                    <i
                      className={`icon-eye-${
                        !(confirmPasswordType === "text") ? "hide" : "show"
                      }-line`}
                    />
                  </span>
                </fieldset>
                <fieldset className="">
                  <input
                    className=""
                    type="tel"
                    placeholder="Mobile number*"
                    name="mobileNumber"
                    tabIndex={3}
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    aria-required="true"
                    disabled={isLoading}
                    required
                  />
                </fieldset>
                <div className="d-flex align-items-center">
                  <div className="tf-cart-checkbox">
                    <div className="tf-checkbox-wrapp">
                      <input
                        className=""
                        type="checkbox"
                        id="login-form_agree"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                      />
                      <div>
                        <i className="icon-check" />
                      </div>
                    </div>
                    <label
                      className="text-secondary-2"
                      htmlFor="login-form_agree"
                    >
                      I agree to the&nbsp;
                    </label>
                  </div>
                  <Link href={`/term-of-use`} title="Terms of Service">
                    Terms of User
                  </Link>
                </div>
              </div>
              <div className="button-submit">
                <button
                  className="tf-btn btn-fill"
                  type="submit"
                  disabled={isLoading}
                >
                  <span className="text text-button">
                    {isLoading ? "Registering..." : "Register"}
                  </span>
                </button>
              </div>
            </form>
          </div>
          <div className="right">
            <h4 className="mb_8">Already have an account?</h4>
            <p className="text-secondary">
              Welcome back. Sign in to access your personalized experience,
              saved preferences, and more. We're thrilled to have you with us
              again!
            </p>
            <Link href={`/login`} className="tf-btn btn-fill">
              <span className="text text-button">Login</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
