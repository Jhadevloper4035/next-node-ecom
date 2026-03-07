"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hydrate, updateUser } from "@/redux/authSlice";
import { useAxiosInterceptors } from "@/hooks/useAxiosInterceptors";
import { useRouteLoadingState } from "@/hooks/useRouteLoadingState";
import { getMe } from "@/services/user/me.service";
import { getToken } from "@/utlis/auth.utlis";

export default function AuthHydrator() {
  const dispatch = useDispatch();
  const { user, token: storeToken } = useSelector((state) => state.auth);

  useAxiosInterceptors();
  useRouteLoadingState();

  useEffect(() => {
    // 1. First, hydrate auth state (token) from cookies/storage
    dispatch(hydrate());
  }, [dispatch]);

  useEffect(() => {
    const fetchUserData = async () => {
      // Check for token in storage/cookies
      const token = getToken();

      // If we have a token but NO user data in slice, fetch user profile
      if (token && !user) {
        try {
          const res = await getMe();
          if (res.data?.user) {
            dispatch(updateUser(res.data.user));
          }
        } catch (error) {
          console.error("Session sync failed:", error);
          // Token might be invalid/expired, middleware will handle redirection if needed
        }
      }
    };

    fetchUserData();
  }, [dispatch, user]);

  return null; // This component renders nothing
}
