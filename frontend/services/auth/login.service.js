import api from "../../api/api.config";
import { setToken } from "@/utlis/auth.utlis";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export const login = async (email, password) => {
  try {
    const response = await api.post(`/v1/auth/login`, {
      email,
      password,
    }, {
      skipAuth: true,
    });

    const data = response.data.data;
    if (data.accessToken) {
      setToken(data.accessToken);
    }

    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
