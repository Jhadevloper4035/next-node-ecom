"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { verifyEmail } from "@/services/auth/verify-email.service";
import { loginSuccess } from "@/redux/authSlice";
import { useToast } from "@/components/common/ToastContext";

export default function VerifyEmailPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const toast = useToast();

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    window.history.replaceState(null, "", window.location.pathname);
    if (!token) {
      toast("Invalid verification link.", "error");
      router.replace("/login");
      return;
    }
    verifyEmail(token)
      .then((data) => {
        dispatch(loginSuccess({ user: data.user }));
        toast("Your email has been verified.", "success");
        router.replace("/");
      })
      .catch(() => {
        toast("This verification link is invalid or has expired.", "error");
        router.replace("/login");
      });
  }, [dispatch, router, toast]);

  return null;
}
