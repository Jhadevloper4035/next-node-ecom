"use client";

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { verifyOtp as verifyOtpService } from "@/services/auth/otp.service";
import { hideOtpModal, loginSuccess, loginFailure } from "@/redux/authSlice";
import { useRouter } from "next/navigation";

export default function OtpVerification() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { showOtpModal, otpEmail } = useSelector((state) => state.auth);

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);
  const [isResending, setIsResending] = useState(false);

  // Countdown timer for OTP validity
  useEffect(() => {
    if (!showOtpModal || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setError("OTP has expired. Please request a new one.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showOtpModal, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleOtpChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,6}$/.test(value)) {
      setOtp(value);
      setError("");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    if (timeLeft <= 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await verifyOtpService(otpEmail, otp);

      if (response.token) {
        dispatch(
          loginSuccess({
            user: response.user,
            token: response.token,
          }),
        );
        dispatch(hideOtpModal());
        router.push("/");
      }
    } catch (err) {
      const errorMessage =
        err?.message || "OTP verification failed. Please try again.";
      setError(errorMessage);
      dispatch(loginFailure(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setError("");
    setOtp("");

    try {
      // You can call a resend OTP API here if it exists
      // await authService.resendOtp(otpEmail);
      setTimeLeft(300); // Reset timer to 5 minutes
      // Show success message or continue
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    dispatch(hideOtpModal());
    setOtp("");
    setError("");
    setTimeLeft(300);
  };

  if (!showOtpModal) return null;

  return (
    <div
      className="modal fade"
      id="otpVerificationModal"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="otpVerificationLabel"
      aria-hidden="true"
      style={{ display: showOtpModal ? "block" : "none" }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header border-bottom">
            <h5 className="modal-title" id="otpVerificationLabel">
              Verify OTP
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
            />
          </div>
          <div className="modal-body py-4">
            <div className="text-center mb-4">
              <p className="text-secondary mb-1">
                We've sent a verification code to:
              </p>
              <p className="font-weight-bold">{otpEmail}</p>
            </div>

            <form onSubmit={handleVerifyOtp}>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label mb-2">Enter OTP Code</label>
                <input
                  type="text"
                  className="form-control form-control-lg text-center"
                  placeholder="000000"
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength="6"
                  disabled={isLoading}
                  style={{ fontSize: "24px", letterSpacing: "10px" }}
                  required
                />
              </div>

              <div className="mb-3 text-center">
                <p className="text-muted small">
                  Code expires in:{" "}
                  <span
                    className={timeLeft <= 60 ? "text-danger" : "text-primary"}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </p>
              </div>

              <div className="d-grid gap-2 mb-3">
                <button
                  type="submit"
                  className="tf-btn btn-fill"
                  disabled={isLoading || timeLeft <= 0}
                >
                  <span className="text text-button">
                    {isLoading ? "Verifying..." : "Verify OTP"}
                  </span>
                </button>
              </div>

              <div className="text-center">
                <p className="text-muted small mb-0">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={handleResendOtp}
                    disabled={isResending || timeLeft > 240} // Can resend after 1 minute
                  >
                    {isResending ? "Resending..." : "Resend OTP"}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {showOtpModal && (
        <div
          className="modal-backdrop fade show"
          onClick={handleClose}
          style={{ display: "block" }}
        />
      )}
    </div>
  );
}
