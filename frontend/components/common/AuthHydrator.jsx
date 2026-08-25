"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateUser } from "@/redux/authSlice";
import { setInitialLoading } from "@/redux/uiSlice";
import { useAxiosInterceptors } from "@/hooks/useAxiosInterceptors";
import { useRouteLoadingState } from "@/hooks/useRouteLoadingState";
import { getMe } from "@/services/user/me.service";
import { clearAuth } from "@/utlis/auth.utlis";

const protectedRoutes = ["/my-account", "/my-account-address", "/my-account-orders", "/my-account-orders-details", "/checkout", "/view-cart"];
const guestOnlyRoutes = ["/login", "/register", "/forget-password"];

export default function AuthHydrator() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const pathname = usePathname();
  const router = useRouter();
  const isGuestOnlyRoute = guestOnlyRoutes.includes(pathname);

  useAxiosInterceptors();
  useRouteLoadingState();

  useEffect(() => {
    clearAuth();
    // Mark initial loading as complete after some time
    // This gives enough time for AuthHydrator and initial page components to trigger their API calls
    const timer = setTimeout(() => {
      dispatch(setInitialLoading(false));
    }, 2000); // Increased to 2 seconds to be safe
    return () => clearTimeout(timer);
  }, [dispatch]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        if (isGuestOnlyRoute) router.replace("/my-account");
        return;
      }
      if (pathname === "/reset-password") return;

      try {
        const res = await getMe();
        if (!res.data?.user) throw new Error("No active session");
        dispatch(updateUser(res.data.user));
        if (isGuestOnlyRoute) router.replace("/my-account");
      } catch {
        dispatch(logout());
        if (protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    };

    fetchUserData();
  }, [dispatch, isGuestOnlyRoute, pathname, router, user]);

  return null; // This component renders nothing
}
