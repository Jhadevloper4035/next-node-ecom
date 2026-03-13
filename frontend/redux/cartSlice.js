import { createSlice } from "@reduxjs/toolkit";
import { allProducts } from "@/data/products";

// helper to compute total price
const calculateTotal = (cartProducts) =>
  cartProducts.reduce((acc, p) => acc + (p.quantity || 0) * (p.price || 0), 0);

// try to load from localStorage (client only)
const loadCartFromStorage = () => {
  if (typeof window !== "undefined") {
    try {
      const items = JSON.parse(localStorage.getItem("cartList"));
      return Array.isArray(items) ? items : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

const initialState = {
  cartProducts: loadCartFromStorage(),
  totalPrice: calculateTotal(loadCartFromStorage()),
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addProduct(state, action) {
  const { id, qty = 1, product = null } = action.payload;
      const exists = state.cartProducts.find((p) => p.id === id);
      if (!exists) {
        const productData = product || allProducts.find((p) => p.id === id);
        if (productData) {
          const item = {
            ...productData,
            quantity: qty,
          };
          // Make sure price is a number to avoid checkout issues
          item.price = typeof item.price === "number" ? item.price : 0;
          state.cartProducts.push(item);
        }
      } else {
        exists.quantity += qty;
        // Optionally update the existing product details if newly added
        if (product) {
          exists.price = typeof product.price === "number" ? product.price : exists.price;
        }
      }
      state.totalPrice = calculateTotal(state.cartProducts);
      if (typeof window !== "undefined") {
        localStorage.setItem("cartList", JSON.stringify(state.cartProducts));
      }
    },
    updateQuantity(state, action) {
      const { id, qty } = action.payload;
      const item = state.cartProducts.find((p) => p.id === id);
      if (item) {
        item.quantity = qty;
        state.totalPrice = calculateTotal(state.cartProducts);
        if (typeof window !== "undefined") {
          localStorage.setItem("cartList", JSON.stringify(state.cartProducts));
        }
      }
    },
    removeProduct(state, action) {
      state.cartProducts = state.cartProducts.filter(
        (p) => p.id !== action.payload.id
      );
      state.totalPrice = calculateTotal(state.cartProducts);
      if (typeof window !== "undefined") {
        localStorage.setItem("cartList", JSON.stringify(state.cartProducts));
      }
    },
    clearCart(state) {
      state.cartProducts = [];
      state.totalPrice = 0;
      if (typeof window !== "undefined") {
        localStorage.removeItem("cartList");
      }
    },
  },
});

export const { addProduct, updateQuantity, removeProduct, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
