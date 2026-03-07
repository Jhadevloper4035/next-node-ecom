import { useEffect } from "react";
import axiosInstance from "@/api/api.config";

// This hook initializes axios interceptors
// Call this once in a client component that loads early (like AuthHydrator)
export const useAxiosInterceptors = () => {
  useEffect(() => {
    // Interceptors are already set up in api.config.js
    // This hook ensures they're initialized when the app loads
  }, []);
};
