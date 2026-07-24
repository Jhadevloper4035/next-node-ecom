import api from "../../api/api.config";
import { setToken } from "@/utlis/auth.utlis";
import { throwAuthError } from "./error.service";

export const login = async (email, password) => {
  try {
    const response = await api.post(`/v1/auth/login`, {
      email,
      password,
    }, {
      skipAuth: true,
    });

    const data = response.data.data;
    if (data.accessToken) {
      setToken(data.accessToken);
    }

    return data;
  } catch (error) {
    throwAuthError(error);
  }
};
