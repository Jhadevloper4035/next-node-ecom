import api from "../../api/api.config";

export const getAllCategories = async () => {
    try {
        const response = await api.get("/v1/categories/tree");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};