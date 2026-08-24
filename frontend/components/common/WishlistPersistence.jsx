"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/redux/authSlice";
import { replaceWishlist } from "@/redux/wishlistSlice";
import { getWishlist, saveWishlist } from "@/services/wishlist/wishlist.service";

const wishlistOwnerKey = "wishlistOwnerId";
const itemId = (item) => String(item._id || item.id || "");
const productIds = (items) => items
  .map(itemId)
  .filter((id) => /^[a-f\d]{24}$/i.test(id));

const mergeWishlistItems = (savedItems, localItems) => {
  const items = new Map(savedItems.map((item) => [itemId(item), item]));
  localItems.forEach((item) => items.set(itemId(item), item));
  return [...items.values()];
};

export default function WishlistPersistence() {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.user?.id || state.auth.user?._id);
  const wishList = useSelector((state) => state.wishlist.wishList);
  const wishlistRef = useRef(wishList);
  const [readyUserId, setReadyUserId] = useState(null);

  useEffect(() => {
    wishlistRef.current = wishList;
  }, [wishList]);

  useEffect(() => {
    if (!userId) {
      setReadyUserId(null);
      return undefined;
    }

    let cancelled = false;
    setReadyUserId(null);

    getWishlist()
      .then((response) => {
        if (cancelled) return;
        const savedItems = response.data?.items || [];
        const sameOwner = localStorage.getItem(wishlistOwnerKey) === String(userId);
        dispatch(replaceWishlist(sameOwner ? savedItems : mergeWishlistItems(savedItems, wishlistRef.current)));
        localStorage.setItem(wishlistOwnerKey, String(userId));
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          cancelled = true;
          dispatch(logout());
        }
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
      saveWishlist(productIds(wishList)).catch((error) => {
        if (error.response?.status === 401) dispatch(logout());
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [dispatch, readyUserId, userId, wishList]);

  return null;
}
