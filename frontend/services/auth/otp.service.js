import axios from "axios";
import { setToken, storeUser } from "./utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export const verifyOtp = async (email, otp) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/v1/auth/verify-otp`, {
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
