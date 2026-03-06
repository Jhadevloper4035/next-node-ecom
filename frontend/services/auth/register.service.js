import axiosInstance from "../api.config";
import { setToken } from "./utils";

export const register = async (fullName, email, password, mobileNumber) => {
  try {
    const response = await axiosInstance.post(`/v1/auth/register`, {
      fullName,
      email,
      password,
      mobileNumber,
    });
    const data = response.data;
    const normalized = {
      ...data,
      otpRequired: true,
    };

    if (data.token) {
      setToken(data.token);
    }
    return normalized;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
