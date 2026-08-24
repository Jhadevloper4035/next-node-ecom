import api from "@/api/api.config";

export const subscribeToNewsletter = async (email) => {
  try {
    const response = await api.post("/v1/newsletter/subscribe", { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
