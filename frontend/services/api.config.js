import axios from "axios";
import { store } from "@/redux/store";
import { setIsLoading } from "@/redux/uiSlice";
import { getToken, setToken, clearAuth } from "@/services/auth/utils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let requestCount = 0;
let isRefreshing = false;
let failedQueue = [];

/**
 * Process queued requests while refresh token is happening
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });

  failedQueue = [];
};


// ================================
// REQUEST INTERCEPTOR
// ================================

axiosInstance.interceptors.request.use(
  (config) => {

    // loader start
    requestCount++;
    if (requestCount === 1) {
      store.dispatch(setIsLoading(true));
    }

    // attach token
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// ================================
// RESPONSE INTERCEPTOR
// ================================

axiosInstance.interceptors.response.use(
  (response) => {

    // loader stop
    requestCount--;
    if (requestCount === 0) {
      store.dispatch(setIsLoading(false));
    }

    return response;
  },

  async (error) => {

    const originalRequest = error.config;

    requestCount--;
    if (requestCount === 0) {
      store.dispatch(setIsLoading(false));
    }

    // only handle 401 errors
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // ================================
    // IF TOKEN REFRESH ALREADY RUNNING
    // ================================

    if (isRefreshing) {

      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          console.log("Token refreshed:", token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {

      // call refresh API
      const response = await axios.post(
        `${API_BASE_URL}/v1/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const { accessToken } = response.data.data;

      // save new access token
      setToken(accessToken);

      // process queued requests
      processQueue(null, accessToken);

      // reset refreshing state
      isRefreshing = false;

      // retry original request
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return axiosInstance(originalRequest);

    } catch (refreshError) {

      processQueue(refreshError, null);
      isRefreshing = false;

      clearAuth();

      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;