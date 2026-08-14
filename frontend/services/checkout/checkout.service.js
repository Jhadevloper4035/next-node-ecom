import api from "@/api/api.config";

export const createCheckout = async (payload) => (await api.post("/v1/checkout", payload)).data;
export const getMyOrders = async () => (await api.get("/v1/orders")).data;
export const getOrder = async (orderId) => (await api.get(`/v1/orders/${encodeURIComponent(orderId)}`)).data;
