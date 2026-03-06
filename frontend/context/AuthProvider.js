"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateUser } from "@/redux/authSlice";
import { getMe } from "@/services/auth/me.service";
import { usePathname } from "next/navigation";
import { getToken } from "@/services/auth/utils";
import { useRouter } from "next/navigation";

export default function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const publicPages = ["/login", "/register", "/forgot-password", "/reset-password", "/otp-verification"];
    if (publicPages.includes(pathname)) return;

    const fetchUser = async () => {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      };

      try {
        const res = await getMe();
        if (res.data?.user) {
          dispatch(updateUser(res.data.user));
        }
      } catch (error) {
        console.log("User not logged in or session expired");
      }
    };

    fetchUser();
  }, [dispatch, pathname]);

  return children;
}