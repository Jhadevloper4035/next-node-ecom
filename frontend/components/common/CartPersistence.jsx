"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { replaceCart } from "@/redux/cartSlice";
import { logout } from "@/redux/authSlice";
import { getCart, saveCart } from "@/services/cart/cart.service";

const cartItemKey = (item) => `${item.productId || item._id || item.id}:${(item.selectedOptions || [])
  .map((option) => `${option.key}:${option.value}`)
  .sort()
  .join("|")}`;

const mergeCartItems = (savedItems, localItems) => {
  const merged = new Map(savedItems.map((item) => [cartItemKey(item), item]));

  for (const item of localItems) {
    const key = cartItemKey(item);
    const existing = merged.get(key);
    if (existing) existing.quantity = Math.max(existing.quantity, item.quantity);
    else merged.set(key, item);
  }

  return [...merged.values()];
};

const cartPayload = (items) => items.map((item) => ({
  productId: item.productId || item._id || item.id,
  quantity: item.quantity,
  selectedOptions: item.selectedOptions || [],
}));

export default function CartPersistence() {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.user?.id || state.auth.user?._id);
  const cartProducts = useSelector((state) => state.cart.cartProducts);
  const cartRef = useRef(cartProducts);
  const [readyUserId, setReadyUserId] = useState(null);

  useEffect(() => {
    cartRef.current = cartProducts;
  }, [cartProducts]);

  useEffect(() => {
    if (!userId) {
      setReadyUserId(null);
      return undefined;
    }

    let cancelled = false;
    setReadyUserId(null);

    getCart()
      .then((response) => {
        if (cancelled) return;
        const items = mergeCartItems(response.data?.items || [], cartRef.current);
        dispatch(replaceCart(items));
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          cancelled = true;
          dispatch(logout());
          return;
        }
        console.error("Failed to load saved cart:", error);
      })
      .finally(() => {
        if (!cancelled) setReadyUserId(userId);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, userId]);

  useEffect(() => {
    if (!userId || readyUserId !== userId) return undefined;

    const timer = setTimeout(() => {
      saveCart(cartPayload(cartProducts)).catch((error) => {
        if (error.response?.status === 401) dispatch(logout());
        else console.error("Failed to save cart:", error);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [cartProducts, dispatch, readyUserId, userId]);

  return null;
}
