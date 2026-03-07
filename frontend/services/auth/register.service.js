import api from "../../api/api.config";
import { setToken } from "@/utlis/auth.utlis";

export const register = async (fullName, email, password, mobileNumber) => {
  try {
    const response = await api.post(`/v1/auth/register`, {
      fullName,
      email,
      password,
      mobileNumber,
    }, {
      skipAuth: true,
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
