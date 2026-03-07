import api from "../../api/api.config";

export const forgotPassword = async (email) => {
  try {
    const response = await api.post(`/v1/auth/forgot-password`, {
      email,
    }, {
      skipAuth: true,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
