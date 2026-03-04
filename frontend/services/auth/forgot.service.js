import axiosInstance from "../api.config";

export const forgotPassword = async (email) => {
  try {
    const response = await axiosInstance.post(`/v1/auth/forgot-password`, {
      email,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
