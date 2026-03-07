import { createSlice } from "@reduxjs/toolkit";
import { clearAuth, getToken } from "@/utlis/auth.utlis";

const loadTokenFromCookies = () => {
  if (typeof window !== "undefined") {
    return getToken();
  }
  return null;
};

const initialState = {
  user: null,
  token: loadTokenFromCookies(),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrate(state) {
      if (typeof window !== "undefined") {
        const token = getToken();
        if (token) {
          state.token = token;
        }
      }
    },
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
      state.token = action.payload.token;
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
      state.token = null;
      state.error = null;
      state.isLoading = false;
      clearAuth();
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
  hydrate,
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  setError,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
