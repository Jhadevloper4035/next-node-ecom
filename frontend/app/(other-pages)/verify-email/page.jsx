"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { verifyEmail } from "@/services/auth/verify-email.service";
import { loginSuccess } from "@/redux/authSlice";
import { useToast } from "@/components/common/ToastContext";
import Footer1 from "@/components/footers/Footer1";
import styles from "@/components/otherPages/Login.module.css";

export default function VerifyEmailPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const toast = useToast();
  const [message, setMessage] = useState("Verifying your secure email link…");

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    window.history.replaceState(null, "", window.location.pathname);
    if (!token) {
      setMessage("This verification link is invalid. Redirecting to sign in…");
      toast("Invalid verification link.", "error");
      setTimeout(() => router.replace("/login"), 1200);
      return;
    }
    verifyEmail(token)
      .then((data) => {
        dispatch(loginSuccess({ user: data.user }));
        setMessage("Your email is verified. Taking you to your account…");
        toast("Your email has been verified.", "success");
        setTimeout(() => router.replace("/"), 1200);
      })
      .catch(() => {
        setMessage("This verification link is invalid or expired. Redirecting to sign in…");
        toast("This verification link is invalid or has expired.", "error");
        setTimeout(() => router.replace("/login"), 1200);
      });
  }, [dispatch, router, toast]);

  return <>
    <section className={`${styles.loginContainer} ${styles.authSingleColumn}`}><div className={styles.loginLeft}><div className={styles.loginFormWrapper}>
      <div className={styles.loginHead}><p className={styles.eyebrow}>Account verification</p><h1>Verifying your email</h1><p>{message}</p></div>
    </div></div></section>
    <Footer1 />
  </>;
}
