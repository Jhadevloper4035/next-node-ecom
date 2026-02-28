import { createSlice } from "@reduxjs/toolkit";
import { clearAuth } from "@/services/auth/utils";

// Load user from localStorage (client only)
const loadUserFromStorage = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("authToken");
    return user && token ? JSON.parse(user) : null;
  }
  return null;
};

const initialState = {
  user: loadUserFromStorage(),
  token: typeof window !== "undefined" ? localStorage.getItem("authToken") : null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrate(state) {
      if (typeof window !== "undefined") {
        const user = localStorage.getItem("user");
        const token = localStorage.getItem("authToken");
        if (user && token) {
          state.user = JSON.parse(user);
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
      state.isLoading = false;
      state.user = action.payload.user;
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
  setError,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
