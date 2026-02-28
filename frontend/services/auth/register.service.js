import axios from "axios";
import { setToken, storeUser } from "./utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export const register = async (fullName, email, password, mobileNumber) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/v1/auth/register`, {
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
      storeUser(data.user);
    }
    return normalized;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
