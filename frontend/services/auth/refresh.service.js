import api from "../../api/api.config";
import { setToken } from "@/utlis/auth.utils";

export const refreshToken = async () => {
  try {
    const response = await api.post(`/v1/auth/refresh`);
    const data = response.data.data;

    if (data.accessToken) {
      setToken(data.accessToken);
    }

    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
