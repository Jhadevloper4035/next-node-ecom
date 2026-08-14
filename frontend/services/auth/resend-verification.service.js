import api from "../../api/api.config";
import { throwAuthError } from "./error.service";

export const resendVerification = async (email) => {
  try {
    return (await api.post("/v1/auth/resend-verification", { email }, { skipAuth: true })).data;
  } catch (error) {
    throwAuthError(error);
  }
};
