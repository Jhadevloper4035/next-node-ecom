import axios from "axios";
import { getToken, setToken, clearAuth } from "@/utlis/auth.utlis";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true
});

// Variable to track if a refresh call is currently in progress
let isRefreshing = false;
// Queue to store requests that fail while refreshing is underway
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  if (!config.skipAuth) {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Trigger refresh logic on 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {

      // If a refresh is already in progress, wait for it to finish
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
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

        const newToken = refreshResponse.data?.data?.accessToken;

        if (!newToken) {
          throw new Error("Missing access token in refresh response");
        }

        // Store new token and resume queued requests
        setToken(newToken);
        processQueue(null, newToken);

        // Update current request and retry
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);

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
