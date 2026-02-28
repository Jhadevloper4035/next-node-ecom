import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import wishlistReducer from "./wishlistSlice";
import compareReducer from "./compareSlice";
import uiReducer from "./uiSlice";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
    compare: compareReducer,
    ui: uiReducer,
    auth: authReducer,
  },
});

// optional: export RootState and AppDispatch types for TypeScript
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
