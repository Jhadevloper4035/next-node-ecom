import api from "../../api/api.config";
import { setToken } from "@/utlis/auth.utlis";
import { throwAuthError } from "./error.service";

export const verifyOtp = async (email, otp) => {
  try {
    const response = await api.post(`/v1/auth/verify-otp`, {
      email,
      otp,
    }, {
      skipAuth: true,
    });
    const wrapper = response.data;
    const data = wrapper.data || {};

    if (data.accessToken) {
      setToken(data.accessToken);
    }

    return data;
  } catch (error) {
    throwAuthError(error);
  }
};
