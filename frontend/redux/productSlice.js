import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    products: [],
    selectedProduct: null,
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
        fetchProductStart: (state) => {
            state.loading = true;
            state.error = null;
            state.selectedProduct = null;
        },
        fetchProductSuccess: (state, action) => {
            state.loading = false;
            state.selectedProduct = action.payload;
        },
        fetchProductFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

export const {
    fetchProductsStart,
    fetchProductsSuccess,
    fetchProductsFailure,
    clearProductError,
    fetchProductStart,
    fetchProductSuccess,
    fetchProductFailure,
} = productSlice.actions;

export default productSlice.reducer;
