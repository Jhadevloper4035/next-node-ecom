import { createSlice } from "@reduxjs/toolkit";

const loadCompare = () => {
  if (typeof window !== "undefined") {
    try {
      const items = JSON.parse(localStorage.getItem("compare"));
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }
  return [];
};

const getCompareId = (item) =>
  typeof item === "object" && item !== null ? item.id || item._id : item;

const initialState = {
  compareItem: loadCompare(),
};

const compareSlice = createSlice({
  name: "compare",
  initialState,
  reducers: {
    add(state, action) {
      const item = action.payload;
      const id = getCompareId(item);
      if (!state.compareItem.some((compare) => getCompareId(compare) === id)) {
        state.compareItem.push(item);
        if (typeof window !== "undefined") {
          localStorage.setItem("compare", JSON.stringify(state.compareItem));
        }
      }
    },
    remove(state, action) {
      const id = action.payload;
      state.compareItem = state.compareItem.filter((item) => getCompareId(item) !== id);
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
