import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    addresses: [],
    isLoading: false,
    error: null,
};

const addressSlice = createSlice({
    name: "address",
    initialState,
    reducers: {
        addressStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },
        fetchAddressesSuccess: (state, action) => {
            state.isLoading = false;
            state.addresses = action.payload || [];
        },
        addAddressSuccess: (state, action) => {
            state.isLoading = false;
            state.addresses.push(action.payload);
        },
        updateAddressSuccess: (state, action) => {
            state.isLoading = false;
            const index = state.addresses.findIndex(
                (addr) => (addr.id || addr._id) === (action.payload.id || action.payload._id)
            );
            if (index !== -1) {
                state.addresses[index] = action.payload;
            }
        },
        removeAddressSuccess: (state, action) => {
            state.isLoading = false;
            state.addresses = state.addresses.filter(
                (addr) => (addr.id || addr._id) !== action.payload
            );
        },
        addressFailure: (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        },
        clearAddressError: (state) => {
            state.error = null;
        },
    },
});

export const {
    addressStart,
    fetchAddressesSuccess,
    addAddressSuccess,
    updateAddressSuccess,
    removeAddressSuccess,
    addressFailure,
    clearAddressError,
} = addressSlice.actions;

export default addressSlice.reducer;
