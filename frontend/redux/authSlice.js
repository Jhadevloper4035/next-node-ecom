import { createSlice } from "@reduxjs/toolkit";
import { clearAuth } from "@/utlis/auth.utlis";

const initialState = {
  user: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Login start
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    // Login success
    loginSuccess(state, action) {
      console.log("auth/loginSuccess payload:", action.payload);
      state.isLoading = false;
      // Defensive: extract user if it's nested
      const userData = action.payload.user;
      state.user = userData?.user || userData;
      state.error = null;
    },
    // Login failure
    loginFailure(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    // Logout
    logout(state) {
      state.user = null;
      state.error = null;
      state.isLoading = false;
      clearAuth();
      if (typeof window !== "undefined") localStorage.removeItem("cartOwnerId");
    },
    // Update user
    updateUser(state, action) {
      const userData = action.payload;
      state.user = userData?.user || userData;
    },
    // Set error
    setError(state, action) {
      state.error = action.payload;
    },
    // Clear error
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  setError,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
