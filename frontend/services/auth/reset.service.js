import api from "../../api/api.config";
import { throwAuthError } from "./error.service";

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
    throwAuthError(error);
  }
};
