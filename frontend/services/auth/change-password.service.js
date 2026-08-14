import api from "../../api/api.config";
import { throwAuthError } from "./error.service";

export const changePassword = async (currentPassword, newPassword) => {
  try {
    return (await api.post("/v1/auth/change-password", { currentPassword, newPassword })).data;
  } catch (error) {
    throwAuthError(error);
  }
};
