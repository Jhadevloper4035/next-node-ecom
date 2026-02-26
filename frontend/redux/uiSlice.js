import { createSlice } from "@reduxjs/toolkit";
import { allProducts } from "@/data/products";

const initialState = {
  quickViewItem: allProducts[0] || null,
  quickAddItem: 1,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setQuickViewItem(state, action) {
      state.quickViewItem = action.payload;
    },
    setQuickAddItem(state, action) {
      state.quickAddItem = action.payload;
    },
  },
});

export const { setQuickViewItem, setQuickAddItem } = uiSlice.actions;
export default uiSlice.reducer;
