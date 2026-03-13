import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    products: [],
    loading: false,
    error: null,
};

const productSlice = createSlice({
    name: "product",
    initialState,
    reducers: {
        fetchProductsStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchProductsSuccess: (state, action) => {
            state.loading = false;
            state.products = action.payload || [];
        },
        fetchProductsFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        clearProductError: (state) => {
            state.error = null;
        },
    },
});

export const {
    fetchProductsStart,
    fetchProductsSuccess,
    fetchProductsFailure,
    clearProductError,
} = productSlice.actions;

export default productSlice.reducer;
