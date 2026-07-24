import api from "../../api/api.config";
import { throwAuthError } from "./error.service";

export const forgotPassword = async (email) => {
  try {
    const response = await api.post(`/v1/auth/forgot-password`, {
      email,
    }, {
      skipAuth: true,
    });
    return response.data;
  } catch (error) {
    throwAuthError(error);
  }
};
