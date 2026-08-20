import api from "@/api/api.config";

export const getCart = async () => (await api.get("/v1/cart")).data;
export const saveCart = async (items) => (await api.put("/v1/cart", { items })).data;
