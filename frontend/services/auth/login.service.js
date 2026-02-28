import axios from "axios";
import { setToken, storeUser } from "./utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/v1/auth/login`, {
      email,
      password,
    });

    const data = response.data.data;
    if (data.accessToken) {
      setToken(data.accessToken);
      storeUser(data.user);
    }

    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
