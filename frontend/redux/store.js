import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import wishlistReducer from "./wishlistSlice";
import compareReducer from "./compareSlice";
import uiReducer from "./uiSlice";
import authReducer from "./authSlice";
import addressReducer from "./addressSlice";
import categoryReducer from "./categorySlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
    compare: compareReducer,
    ui: uiReducer,
    auth: authReducer,
    address: addressReducer,
    category: categoryReducer,
  },
});

// optional: export RootState and AppDispatch types for TypeScript
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
