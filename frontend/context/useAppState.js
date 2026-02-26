// "use client";
import { useSelector, useDispatch } from "react-redux";
import { addProduct, updateQuantity } from "@/redux/cartSlice";
import { addToWishlist, removeFromWishlist } from "@/redux/wishlistSlice";
import { addToCompare, removeFromCompare } from "@/redux/compareSlice";
import { setQuickViewItem, setQuickAddItem } from "@/redux/uiSlice";
import { openCartModal } from "@/utlis/openCartModal";
import { openWistlistModal } from "@/utlis/openWishlist";

// an adapter hook providing the legacy context API shape; no provider is
// necessary now because all state lives in Redux. the project can keep
// consuming this hook until every component is rewritten, after which the file
// may be removed entirely.
export const useAppState = () => {
  const dispatch = useDispatch();

  const cartProducts = useSelector((s) => s.cart.cartProducts);
  const totalPrice = useSelector((s) => s.cart.totalPrice);

  const wishList = useSelector((s) => s.wishlist.wishList);
  const compareItem = useSelector((s) => s.compare.compareItem);

  const quickViewItem = useSelector((s) => s.ui.quickViewItem);
  const quickAddItem = useSelector((s) => s.ui.quickAddItem);

  const isAddedToCartProducts = (id) =>
    cartProducts.find((elm) => elm.id == id) !== undefined;

  const addProductToCart = (id, qty = 1, isModal = true) => {
    dispatch(addProduct({ id, qty }));
    if (isModal) openCartModal();
  };

  const updateQty = (id, qty) => {
    dispatch(updateQuantity({ id, qty }));
  };

  const addToWishlistHandler = (id) => {
    dispatch(addToWishlist(id));
    openWistlistModal();
  };

  const removeFromWishlistHandler = (id) => {
    dispatch(removeFromWishlist(id));
  };

  const addToCompareItem = (id) => {
    dispatch(addToCompare(id));
  };

  const removeFromCompareItem = (id) => {
    dispatch(removeFromCompare(id));
  };

  const isAddedtoWishlist = (id) => wishList.includes(id);
  const isAddedtoCompareItem = (id) => compareItem.includes(id);

  const setQuickView = (item) => dispatch(setQuickViewItem(item));
  const setQuickAdd = (val) => dispatch(setQuickAddItem(val));

  return {
    cartProducts,
    totalPrice,
    addProductToCart,
    isAddedToCartProducts,
    removeFromWishlist: removeFromWishlistHandler,
    addToWishlist: addToWishlistHandler,
    isAddedtoWishlist,
    quickViewItem,
    wishList,
    setQuickViewItem: setQuickView,
    quickAddItem,
    setQuickAddItem: setQuickAdd,
    addToCompareItem,
    isAddedtoCompareItem,
    removeFromCompareItem,
    compareItem,
    updateQuantity: updateQty,
  };
};
