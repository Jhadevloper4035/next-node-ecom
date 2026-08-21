import { createSlice } from "@reduxjs/toolkit";

// helper to compute total price
const calculateTotal = (cartProducts) =>
  cartProducts.reduce((acc, p) => acc + (p.quantity || 0) * (p.price || 0), 0);

const sameCartId = (a, b) => String(a) === String(b);
const productId = (item) => item.productId || item.product || item._id || item.id;
const isCheckoutProduct = (item) => /^[a-f\d]{24}$/i.test(String(productId(item) || ""));
const cartItemKey = (item) => `${productId(item)}:${(item.selectedOptions || [])
  .map((option) => `${option.key}:${option.value}`)
  .sort()
  .join("|")}`;

const mergeDuplicateItems = (items) => {
  const cart = new Map();

  for (const item of items) {
    const existing = cart.get(cartItemKey(item));
    if (existing) existing.quantity += item.quantity || 0;
    else cart.set(cartItemKey(item), item);
  }

  return [...cart.values()];
};

// try to load from localStorage (client only)
const loadCartFromStorage = () => {
  if (typeof window !== "undefined") {
    try {
      const items = JSON.parse(localStorage.getItem("cartList"));
      if (!Array.isArray(items)) return [];

      const checkoutItems = items.filter(isCheckoutProduct);
      if (checkoutItems.length !== items.length) {
        localStorage.setItem("cartList", JSON.stringify(checkoutItems));
      }
      return mergeDuplicateItems(checkoutItems);
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
      const item = product && {
        ...product,
        id: product.id || product._id || id,
        quantity: qty,
      };
      if (item && !isCheckoutProduct(item)) return;
      const exists = state.cartProducts.find((p) => item && cartItemKey(p) === cartItemKey(item));
      if (!exists) {
        if (item) {
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
      const item = state.cartProducts.find((p) => sameCartId(p.id, id));
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
        (p) => !sameCartId(p.id, action.payload.id)
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
    removePurchasedProducts(state, action) {
      const purchased = new Set(action.payload.map(cartItemKey));
      state.cartProducts = state.cartProducts.filter((item) => !purchased.has(cartItemKey(item)));
      state.totalPrice = calculateTotal(state.cartProducts);
      if (typeof window !== "undefined") {
        localStorage.setItem("cartList", JSON.stringify(state.cartProducts));
      }
    },
    removeInvalidProducts(state) {
      state.cartProducts = state.cartProducts.filter(isCheckoutProduct);
      state.totalPrice = calculateTotal(state.cartProducts);
      if (typeof window !== "undefined") {
        localStorage.setItem("cartList", JSON.stringify(state.cartProducts));
      }
    },
    replaceCart(state, action) {
      state.cartProducts = mergeDuplicateItems(action.payload.filter(isCheckoutProduct));
      state.totalPrice = calculateTotal(state.cartProducts);
      if (typeof window !== "undefined") {
        localStorage.setItem("cartList", JSON.stringify(state.cartProducts));
      }
    },
  },
});

export const { addProduct, updateQuantity, removeProduct, clearCart, removeInvalidProducts, removePurchasedProducts, replaceCart } =
  cartSlice.actions;
export default cartSlice.reducer;
