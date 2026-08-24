"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useAppState } from "@/context/useAppState";
import { clearWishlist } from "@/redux/wishlistSlice";
import styles from "./ShopCart.module.css";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const productHref = (product) => product.slug ? `/product/${product.slug}` : `/product-detail/${product.id}`;

export default function Wishlist() {
  const { addProductToCart, cartProducts, removeFromWishlist, wishList } = useAppState();
  const dispatch = useDispatch();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [mounted, setMounted] = useState(false);
  const totalPrice = wishList.reduce((total, product) => total + Number(product.price || 0), 0);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  if (!wishList.length) return <section className={styles.cartPage}><div className={styles.empty}><h1>Your wishlist is empty</h1><p>Save furniture you love here, then add it to your cart when you are ready.</p><Link href="/all-products" className={styles.primaryButton}>Explore products</Link></div></section>;

  const addAllToCart = () => {
    if (adding) return;
    setAdding(true);
    const cartProductIds = new Set(cartProducts.map((product) => String(product.productId || product._id || product.id)));
    wishList.filter((product) => !cartProductIds.has(String(product.id || product._id))).forEach((product) => addProductToCart(product.id || product._id, 1, false, product));
    dispatch(clearWishlist());
    router.push("/shopping-cart");
  };

  return <section className={styles.cartPage}>
    <div className={styles.container}>
      <div className={styles.headingRow}><h1>Your Wishlist <span>({wishList.length} {wishList.length === 1 ? "item" : "items"})</span></h1></div>
      <div className={styles.layout}>
        <div className={styles.itemsPanel}>
          {wishList.map((product) => <article className={styles.item} key={product.id || product._id}>
            <Link href={productHref(product)} className={styles.image}><Image alt={product.title || "Product"} src={product.imgSrc || "/images/placeholder.svg"} fill sizes="(max-width: 767px) 96px, 168px" /></Link>
            <div className={styles.itemInfo}><Link href={productHref(product)} className={styles.productName}>{product.title || "Product"}</Link><p className={styles.price}>{money(product.price)}</p><p className={styles.deliveryNote}>Add this item to your cart when you are ready to order.</p></div>
            <div className={styles.itemTotal}><strong>{money(product.price)}</strong><button type="button" onClick={() => removeFromWishlist(product.id || product._id)}>Remove</button></div>
          </article>)}
        </div>
        <aside className={styles.summary}>
          <h2>Wishlist Summary</h2>
          <div className={styles.summaryRow}><span>Saved items ({wishList.length})</span><strong>{money(totalPrice)}</strong></div>
          <div className={styles.rule} />
          <div className={styles.total}><span>Total value</span><strong>{money(totalPrice)}</strong></div>
          <p className={styles.saveNote}>Add all saved items to your cart in one step.</p>
          <button type="button" className={styles.primaryButton} onClick={addAllToCart} disabled={adding}>{adding ? "Opening cart..." : "Add all to cart"}</button>
        </aside>
      </div>
    </div>
  </section>;
}
