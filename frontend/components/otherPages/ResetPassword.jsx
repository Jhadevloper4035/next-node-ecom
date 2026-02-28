"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/services/auth/reset.service";
import { useToast } from "@/components/common/ToastContext";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!password || password.length < 8) {
      const msg = "Password must be at least 8 characters";
      setError(msg);
      toast(msg, "warning");
      return;
    }
    if (password !== confirmPassword) {
      const msg = "Passwords do not match";
      setError(msg);
      toast(msg, "warning");
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(token, password);
      const msg = "Your password has been reset. You can now log in.";
      setMessage(msg);
      toast(msg, "success");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      const errMsg = err?.message || "Reset failed. Please try again.";
      setError(errMsg);
      toast(errMsg, "error");
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
              <h4 className="mb_8">Choose new password</h4>
              <p>Enter a secure password and confirm below.</p>
            </div>
            <form
              onSubmit={handleSubmit}
              className="form-login form-has-password"
            >
              {error && <div className="alert alert-danger">{error}</div>}
              {message && <div className="alert alert-success">{message}</div>}
              <div className="wrap">
                <fieldset className="position-relative password-item">
                  <input
                    className="input-password"
                    type="password"
                    placeholder="New Password*"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </fieldset>
                <fieldset className="position-relative password-item">
                  <input
                    className="input-password"
                    type="password"
                    placeholder="Confirm Password*"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </fieldset>
              </div>
              <div className="button-submit">
                <button
                  className="tf-btn btn-fill"
                  type="submit"
                  disabled={isLoading}
                >
                  <span className="text text-button">
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </span>
                </button>
              </div>
            </form>
          </div>
          <div className="right">{/* Optionally some info or links */}</div>
        </div>
      </div>
    </section>
  );
}
