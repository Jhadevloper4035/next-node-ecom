import { createSlice } from "@reduxjs/toolkit";

const loadWishlist = () => {
  if (typeof window !== "undefined") {
    try {
      const items = JSON.parse(localStorage.getItem("wishlist"));
      return Array.isArray(items) ? items : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

const initialState = {
  wishList: loadWishlist(),
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    add(state, action) {
      const product = action.payload;
      const id = product.id || product._id;
      if (!state.wishList.find((item) => (item.id || item._id) === id)) {
        state.wishList.push(product);
        if (typeof window !== "undefined") {
          localStorage.setItem("wishlist", JSON.stringify(state.wishList));
        }
      }
    },
    remove(state, action) {
      const id = action.payload;
      state.wishList = state.wishList.filter((item) => (item.id || item._id) !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("wishlist", JSON.stringify(state.wishList));
      }
    },
    clear(state) {
      state.wishList = [];
      if (typeof window !== "undefined") {
        localStorage.removeItem("wishlist");
      }
    },
  },
});

export const { add: addToWishlist, remove: removeFromWishlist, clear: clearWishlist } =
  wishlistSlice.actions;
export default wishlistSlice.reducer;

