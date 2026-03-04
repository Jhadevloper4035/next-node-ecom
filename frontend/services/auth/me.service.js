import axiosInstance from "../api.config";
import { getToken } from "./utils";

export const getMe = async () => {
  try {
    const token = getToken();
    console.log("Getting user info with token:", token);
    const response = await axiosInstance.get(`/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
