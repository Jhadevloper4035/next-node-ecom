import { createSlice } from "@reduxjs/toolkit";
import { allProducts } from "@/data/products";

const initialState = {
  quickViewItem: allProducts[0] || null,
  quickAddItem: 1,
  loadingCount: 0,
  isInitialLoading: true,
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
      if (action.payload) {
        state.loadingCount++;
      } else {
        state.loadingCount = Math.max(0, state.loadingCount - 1);
      }
    },
    setInitialLoading(state, action) {
      state.isInitialLoading = action.payload;
    },
    resetLoading(state) {
      state.loadingCount = 0;
      state.isInitialLoading = false;
    }
  },
});

export const { setQuickViewItem, setQuickAddItem, setIsLoading, setInitialLoading, resetLoading } = uiSlice.actions;
export const selectIsLoading = (state) => state.ui.loadingCount > 0;
export default uiSlice.reducer;

