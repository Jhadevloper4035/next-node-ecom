"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { login as loginService } from "@/services/auth/login.service";
import { loginStart, loginSuccess, loginFailure } from "@/redux/authSlice";
import { useToast } from "@/components/common/ToastContext";

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
        // Login successful, response contains token and user
        // optionally call getMe for latest user data
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
    <section className="flat-spacing">
      <div className="container">
        <div className="login-wrap">
          <div className="left">
            <div className="heading">
              <h4>Login</h4>
            </div>
            <form
              onSubmit={handleLogin}
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
                    type="email"
                    placeholder="Username or email address*"
                    name="email"
                    tabIndex={2}
                    value={formData.email}
                    onChange={handleInputChange}
                    aria-required="true"
                    required
                    disabled={isLoading}
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
                    required
                    disabled={isLoading}
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
                <div className="d-flex align-items-center justify-content-between">
                  <div className="tf-cart-checkbox">
                    <div className="tf-checkbox-wrapp">
                      <input
                        defaultChecked
                        className=""
                        type="checkbox"
                        id="login-form_agree"
                        name="agree_checkbox"
                      />
                      <div>
                        <i className="icon-check" />
                      </div>
                    </div>
                    <label htmlFor="login-form_agree"> Remember me </label>
                  </div>
                  <Link
                    href={`/forget-password`}
                    className="font-2 text-button forget-password link"
                  >
                    Forgot Your Password?
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
                    {isLoading ? "Logging in..." : "Login"}
                  </span>
                </button>
              </div>
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
