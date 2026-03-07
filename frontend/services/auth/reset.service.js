import api from "../../api/api.config";

export const resetPassword = async (token, password) => {
  try {
    const response = await api.post(`/v1/auth/reset-password`, {
      token,
      password,
    }, {
      skipAuth: true,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
