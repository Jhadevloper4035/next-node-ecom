import api from "@/api/api.config";

export const getWishlist = async () => (await api.get("/v1/wishlist")).data;
export const saveWishlist = async (productIds) =>
  (await api.put("/v1/wishlist", { productIds })).data;
