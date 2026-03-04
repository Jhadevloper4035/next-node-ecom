import axiosInstance from "../api.config";

export const resetPassword = async (token, password) => {
  try {
    const response = await axiosInstance.post(`/v1/auth/reset-password`, {
      token,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
