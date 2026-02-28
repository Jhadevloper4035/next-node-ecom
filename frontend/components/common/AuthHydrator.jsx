"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { hydrate } from "@/redux/authSlice";

/**
 * This component restores auth state from localStorage after client mount.
 * Fixes issue where user data is lost on page refresh.
 */
export default function AuthHydrator() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Hydrate auth state from localStorage after client mounts
    dispatch(hydrate());
  }, [dispatch]);

  return null; // This component renders nothing
}
