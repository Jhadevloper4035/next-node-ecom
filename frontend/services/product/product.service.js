import api from "../../api/api.config";

export const getAllProducts = async (params = {}) => {
    try {
        const { page = 1, limit = 10, sort = 'newest' } = params;
        const response = await api.get(`/v1/product/`, {
            params: { page, limit, sort },
            skipAuth: true,
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getProductsByCategoryAndSubcategory = async (categorySlug, subcategorySlug, params = {}) => {
    try {
        const { page = 1, limit = 10 } = params;
        const response = await api.get(`/v1/Product/category/${categorySlug}/subcategory/${subcategorySlug}`, {
            params: { page, limit },
            skipAuth: true,
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
