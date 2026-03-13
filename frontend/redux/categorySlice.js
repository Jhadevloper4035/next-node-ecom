import { createSlice } from "@reduxjs/toolkit";

const categorySlice = createSlice({
    name: "category",
    initialState: {
        categories: [],
        loading: false,
        error: null,
    },
    reducers: {
        fetchCategoriesStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchCategoriesSuccess: (state, action) => {
            state.loading = false;
            state.categories = action.payload;
        },
        fetchCategoriesFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

export const {
    fetchCategoriesStart,
    fetchCategoriesSuccess,
    fetchCategoriesFailure,
} = categorySlice.actions;

export default categorySlice.reducer;
