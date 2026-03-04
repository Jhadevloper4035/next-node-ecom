import axiosInstance from "../api.config";
import { setToken, storeUser } from "./utils";

export const verifyOtp = async (email, otp) => {
  try {
    const response = await axiosInstance.post(`/v1/auth/verify-otp`, {
      email,
      otp,
    });
    const wrapper = response.data;
    const data = wrapper.data || {};

    if (data.accessToken) {
      setToken(data.accessToken);
      storeUser(data.user);
    }

    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
