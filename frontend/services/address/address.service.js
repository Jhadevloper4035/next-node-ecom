import axiosInstance from "../api.config";

export const getAllAddresses = async () => {
    try {
        const response = await axiosInstance.get("/v1/address");
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createAddress = async (addressData) => {
    try {
        const response = await axiosInstance.post("/v1/address", addressData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateAddress = async (addressId, addressData) => {
    try {
        const response = await axiosInstance.put(`/v1/address/${addressId}`, addressData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteAddress = async (addressId) => {
    try {
        const response = await axiosInstance.delete(`/v1/address/${addressId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
