import api from "../../api/api.config";

export const refreshToken = async () => {
  try {
    const response = await api.post(`/v1/auth/refresh`, {}, { skipAuth: true });
    const data = response.data.data;

    return data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
