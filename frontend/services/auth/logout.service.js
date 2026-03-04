import axiosInstance from "../api.config";
import { clearAuth } from "./utils";

export const logoutAPI = async () => {
  try {
    const response = await axiosInstance.post(`/v1/auth/logout`);
    clearAuth();
    return response.data;
  } catch (error) {
    clearAuth();
    throw error.response?.data || error.message;
  }
};
