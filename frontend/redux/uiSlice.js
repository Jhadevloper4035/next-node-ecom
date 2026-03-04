import { createSlice } from "@reduxjs/toolkit";
import { allProducts } from "@/data/products";

const initialState = {
  quickViewItem: allProducts[0] || null,
  quickAddItem: 1,
  isLoading: false,
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
    setIsLoading(state, action) {
      state.isLoading = action.payload;
    },
  },
});

export const { setQuickViewItem, setQuickAddItem, setIsLoading } = uiSlice.actions;
export default uiSlice.reducer;
