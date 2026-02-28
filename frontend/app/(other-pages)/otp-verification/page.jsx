"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { verifyOtp } from "@/services/auth/otp.service";
import { loginSuccess, loginFailure } from "@/redux/authSlice";
import { useToast } from "@/components/common/ToastContext";

export default function OtpVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (!email) {
      setError("Invalid access. Email parameter is missing.");
    }
  }, [email]);

  const handleOtpChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,6}$/.test(value)) {
      setOtp(value);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      const msg = "Please enter a valid 6-digit OTP";
      setError(msg);
      toast(msg, "warning");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await verifyOtp(email, otp);
      // data should contain user and accessToken after service normalization
      if (data.accessToken) {
        dispatch(
          loginSuccess({
            user: data.user,
            token: data.accessToken,
          }),
        );
        toast("OTP verified, logging you in", "success");
        // wait for state update and storage write before redirecting
        setTimeout(() => {
          router.push("/");
        }, 200);
      }
    } catch (err) {
      const msg = err?.message || "OTP verification failed. Please try again.";
      setError(msg);
      toast(msg, "error");
      dispatch(loginFailure(msg));
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
              <h4 className="mb_8">Verify OTP</h4>
              <p>
                Enter the one-time code sent to <strong>{email}</strong>.
              </p>
            </div>
            <form
              onSubmit={handleSubmit}
              className="form-login form-has-password"
            >
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="wrap">
                <fieldset className="">
                  <input
                    type="text"
                    className="form-control form-control-lg text-center"
                    placeholder="000000"
                    value={otp}
                    onChange={handleOtpChange}
                    maxLength={6}
                    disabled={isLoading}
                    required
                    style={{ fontSize: "24px", letterSpacing: "10px" }}
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
                    {isLoading ? "Verifying..." : "Verify OTP"}
                  </span>
                </button>
              </div>
            </form>
          </div>
          <div className="right">{/* optional info or illustration */}</div>
        </div>
      </div>
    </section>
  );
}
