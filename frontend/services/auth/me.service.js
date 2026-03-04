import axiosInstance from "../api.config";

export const getMe = async () => {
  try {
    // Token is automatically added to headers by axios interceptor
    const response = await axiosInstance.get(`/v1/auth/me`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
