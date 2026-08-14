import axios from "axios";
import { clearAuth } from "@/utlis/auth.utlis";

const normalizeApiBaseUrl = (url) => {
  const fallback = "http://localhost:5000/api";
  const raw = (url || fallback).replace(/\/+$/, "");
  if (process.env.NEXT_RUNTIME !== "nodejs") return raw.startsWith("http") ? "/api/backend" : raw;

  return raw.endsWith("/v1") ? raw.slice(0, -3) : raw;
};

const api = axios.create({
  baseURL: normalizeApiBaseUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
  ),
  withCredentials: true
});

// Variable to track if a refresh call is currently in progress
let isRefreshing = false;
// Queue to store requests that fail while refreshing is underway
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Trigger refresh logic on 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest?._retry && !originalRequest?.skipAuth) {

      // If a refresh is already in progress, wait for it to finish
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("Token expired. Refreshing...");

        // Use clean axios call to the refresh endpoint
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (refreshResponse.status !== 200) throw new Error("Unable to refresh session");
        processQueue(null);

        return api(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError);

        // If the refresh token itself is expired, log out the user
        clearAuth();
        // Optional: window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
