import api from "../../api/api.config";
import { throwAuthError } from "./error.service";

export const verifyEmail = async (token) => {
  try {
    const response = await api.post("/v1/auth/verify-email", { token }, { skipAuth: true });
    const data = response.data.data;
    return data;
  } catch (error) {
    throwAuthError(error);
  }
};
