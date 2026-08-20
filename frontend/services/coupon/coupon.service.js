import api from "@/api/api.config";

export const getCoupon = async (code) => (await api.get(`/v1/coupons/${encodeURIComponent(code)}`)).data;
