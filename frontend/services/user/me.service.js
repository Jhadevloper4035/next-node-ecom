import api from "../../api/api.config";

export const getMe = async () => {
  try {
    // Token is automatically added to headers by axios interceptor
    const response = await api.get(`/v1/auth/me`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
