import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export const resetPassword = async (token, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/v1/auth/reset-password`, {
      token,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
