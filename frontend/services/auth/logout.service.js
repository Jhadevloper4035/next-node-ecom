import api from "../../api/api.config";
import { clearAuth } from "@/utlis/auth.utlis";

export const logoutAPI = async () => {
  try {
    const response = await api.post(`/v1/auth/logout`);
    clearAuth();
    return response.data;
  } catch (error) {
    clearAuth();
    throw error.response?.data || error.message;
  }
};
