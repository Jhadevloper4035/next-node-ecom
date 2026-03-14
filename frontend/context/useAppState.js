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

  // Read products from Redux as fallback for dynamic products
  const apiProducts = useSelector((s) => s.product?.products || []);
  const selectedProduct = useSelector((s) => s.product?.selectedProduct);

  const isAddedToCartProducts = (id) =>
    cartProducts.find((elm) => elm.id == id) !== undefined;

  const addProductToCart = (id, qty = 1, isModal = true, productFull = null) => {
    let pObj = productFull;
    if (!pObj) {
      pObj = apiProducts.find((p) => p.id === id || p._id === id);
    }
    if (!pObj && selectedProduct && (selectedProduct.id === id || selectedProduct._id === id)) {
      pObj = selectedProduct;
    }

    if (pObj) {
      // Ensure the object has the fields expected by the UI and Cart
      pObj = {
        ...pObj,
        id: pObj.id || pObj._id,
        price: pObj.price !== undefined ? pObj.price : (pObj.basePrice || 0),
        imgSrc: pObj.imgSrc || (pObj.images && pObj.images.length > 0 ? (typeof pObj.images[0] === 'string' ? pObj.images[0] : pObj.images[0].url) : "/images/placeholder.jpg"),
        title: pObj.title || pObj.name || "Product"
      };
    }

    dispatch(addProduct({ id, qty, product: pObj }));
    if (isModal) openCartModal();
  };

  const updateQty = (id, qty) => {
    dispatch(updateQuantity({ id, qty }));
  };

  const addToWishlistHandler = (id, productFull = null) => {
    let pObj = productFull;
    if (!pObj) {
      pObj = apiProducts.find((p) => p.id === id || p._id === id);
    }
    if (!pObj && selectedProduct && (selectedProduct.id === id || selectedProduct._id === id)) {
      pObj = selectedProduct;
    }

    if (pObj) {
      // Ensure the object has the fields expected by the UI
      pObj = {
        ...pObj,
        id: pObj.id || pObj._id,
        price: pObj.price !== undefined ? pObj.price : (pObj.basePrice || 0),
        imgSrc: pObj.imgSrc || (pObj.images && pObj.images.length > 0 ? (typeof pObj.images[0] === 'string' ? pObj.images[0] : pObj.images[0].url) : "/images/placeholder.jpg"),
        title: pObj.title || pObj.name || "Product"
      };
      dispatch(addToWishlist(pObj));
    } else {
      dispatch(addToWishlist({ id }));
    }
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

  const isAddedtoWishlist = (id) => wishList.some((elm) => (elm.id || elm._id) == id);
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
