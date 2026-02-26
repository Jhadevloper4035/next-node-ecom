import { createSlice } from "@reduxjs/toolkit";

const loadCompare = () => {
  if (typeof window !== "undefined") {
    const items = JSON.parse(localStorage.getItem("compare"));
    return Array.isArray(items) ? items : [];
  }
  return [];
};

const initialState = {
  compareItem: loadCompare(),
};

const compareSlice = createSlice({
  name: "compare",
  initialState,
  reducers: {
    add(state, action) {
      const id = action.payload;
      if (!state.compareItem.includes(id)) {
        state.compareItem.push(id);
        if (typeof window !== "undefined") {
          localStorage.setItem("compare", JSON.stringify(state.compareItem));
        }
      }
    },
    remove(state, action) {
      const id = action.payload;
      state.compareItem = state.compareItem.filter((item) => item !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("compare", JSON.stringify(state.compareItem));
      }
    },
    clear(state) {
      state.compareItem = [];
      if (typeof window !== "undefined") {
        localStorage.removeItem("compare");
      }
    },
  },
});

export const { add: addToCompare, remove: removeFromCompare, clear: clearCompare } =
  compareSlice.actions;
export default compareSlice.reducer;
