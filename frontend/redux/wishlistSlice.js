import { createSlice } from "@reduxjs/toolkit";

const loadWishlist = () => {
  if (typeof window !== "undefined") {
    const items = JSON.parse(localStorage.getItem("wishlist"));
    return Array.isArray(items) ? items : [];
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
      const id = action.payload;
      if (!state.wishList.includes(id)) {
        state.wishList.push(id);
        if (typeof window !== "undefined") {
          localStorage.setItem("wishlist", JSON.stringify(state.wishList));
        }
      }
    },
    remove(state, action) {
      const id = action.payload;
      state.wishList = state.wishList.filter((item) => item !== id);
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
