import api from "../../api/api.config";
import { throwAuthError } from "./error.service";

export const register = async (fullName, email, password, mobileNumber) => {
  try {
    const response = await api.post(`/v1/auth/register`, {
      fullName,
      email,
      password,
      mobileNumber,
    }, {
      skipAuth: true,
    });
    return response.data;
  } catch (error) {
    throwAuthError(error);
  }
};
