import api from "../../api/api.config";

export const getProductReviews = async (productId, params = {}) => {
  try {
    const response = await api.get(`/v1/reviews/product/${productId}`, {
      params: { page: 1, limit: 10, sort: "newest", ...params },
      skipAuth: true,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createProductReview = async (productId, payload) => {
  try {
    const response = await api.post(`/v1/reviews/product/${productId}`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
