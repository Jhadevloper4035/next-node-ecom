import axiosInstance from "../../api/api.config";

export const submitContact = async (contactData) => {
    try {
        const response = await axiosInstance.post("/v1/contact/submit", contactData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
