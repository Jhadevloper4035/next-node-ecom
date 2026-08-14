"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { verifyEmail } from "@/services/auth/verify-email.service";
import { loginSuccess } from "@/redux/authSlice";

export default function VerifyEmailPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    window.history.replaceState(null, "", window.location.pathname);
    if (!token) return setMessage("Invalid verification link.");
    verifyEmail(token)
      .then((data) => {
        dispatch(loginSuccess({ user: data.user }));
        router.replace("/");
      })
      .catch(() => setMessage("This verification link is invalid or has expired."));
  }, [dispatch, router]);

  return <main className="container py-5 text-center"><p>{message}</p></main>;
}
