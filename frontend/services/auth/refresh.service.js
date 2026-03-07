import axiosInstance from "../api.config";
import { setToken } from "./utils";

export const refreshToken = async () => {
  try {
    const response = await axiosInstance.post(`/v1/auth/refresh`);
    const data = response.data.data;
    
    if (data.accessToken) {
      setToken(data.accessToken);
    }
    
    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
