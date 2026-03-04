import axios from "axios";
import { store } from "@/redux/store";
import { setIsLoading } from "@/redux/uiSlice";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

let requestCount = 0;

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    requestCount++;
    if (requestCount === 1) {
      store.dispatch(setIsLoading(true));
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    requestCount--;
    // Hide spinner when all requests are complete
    if (requestCount === 0) {
      store.dispatch(setIsLoading(false));
    }
    return response;
  },
  (error) => {
    requestCount--;
    // Hide spinner when all requests are complete even on error
    if (requestCount === 0) {
      store.dispatch(setIsLoading(false));
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
