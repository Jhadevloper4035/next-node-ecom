import api from "@/api/api.config";

export const createCheckout = async (payload) => (await api.post("/v1/checkout", payload)).data;
export const retryCheckout = async (orderNumber) => (await api.post(`/v1/checkout/${encodeURIComponent(orderNumber)}/retry`)).data;
export const cancelCheckout = async (orderNumber) => (await api.delete(`/v1/checkout/${encodeURIComponent(orderNumber)}`)).data;
export const getActiveCheckout = async () => (await api.get("/v1/checkout/active")).data;
export const getMyOrders = async () => (await api.get("/v1/orders")).data;
export const getOrder = async (orderId) => (await api.get(`/v1/orders/${encodeURIComponent(orderId)}`)).data;
