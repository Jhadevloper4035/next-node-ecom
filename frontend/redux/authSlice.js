import { createSlice } from "@reduxjs/toolkit";
import { clearAuth, getUser, getToken } from "@/services/auth/utils";

// Load user and token from cookies (client only)
const loadFromCookies = () => {
  if (typeof window !== "undefined") {
    return getUser();
  }
  return null;
};

const loadTokenFromCookies = () => {
  if (typeof window !== "undefined") {
    return getToken();
  }
  return null;
};

const initialState = {
  user: loadFromCookies(),
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
        const user = getUser();
        const token = getToken();
        if (user && token) {
          state.user = user;
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
