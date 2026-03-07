import api from "../../api/api.config";

export const updateProfile = async (profileData) => {
    try {
        const response = await api.patch(`/v1/users/profile`, profileData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
