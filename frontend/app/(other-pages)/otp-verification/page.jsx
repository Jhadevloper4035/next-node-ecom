"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { verifyOtp } from "@/services/auth/otp.service";
import { loginSuccess, loginFailure } from "@/redux/authSlice";
import { useToast } from "@/components/common/ToastContext";
import styles from "@/components/otherPages/Login.module.css";

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
    <>
      {/* <Topbar6 bgColor="bg-main" /> */}

      <div className={styles.loginContainer}>
        <div className={styles.loginLeft}>
          <div className={styles.loginFormWrapper}>
            <div className={styles.loginHead}>
              <h2>Verify OTP</h2>
              <p>
                Enter the one-time code sent to <strong>{email}</strong>.
              </p>
            </div>

            {error && <div className={styles.alertError}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.loginForm}>
              <div className={styles.formGroup}>
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
              </div>

              <button
                type="submit"
                className={styles.loginBtn}
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          </div>
        </div>

        <div className={styles.loginRight}>
          <img
            src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=900&fit=crop"
            alt="Premium furniture"
            className={styles.loginRightImage}
          />
        </div>
      </div>
    </>
  );
}
