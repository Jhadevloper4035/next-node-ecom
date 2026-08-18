"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { removeProduct, updateQuantity } from "@/redux/cartSlice";
import styles from "./ShopCart.module.css";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const productHref = (product) => product.slug ? `/product/${product.slug}` : `/product-detail/${product.id}`;
const options = (product) => product.selectedOptions?.map((option) => `${option.label}: ${option.value}`).join(" · ") || "Standard";

export default function ShopCart() {
  const dispatch = useDispatch();
  const cartProducts = useSelector((state) => state.cart.cartProducts);
  const totalPrice = useSelector((state) => state.cart.totalPrice);
  const user = useSelector((state) => state.auth.user);
  const [mounted, setMounted] = useState(false);
  const [pinCode, setPinCode] = useState("");

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  if (!cartProducts.length) return <section className={styles.cartPage}><div className={styles.empty}><h1>Your cart is empty</h1><p>Add furniture you love, then return here to check out.</p><Link href="/all-products" className={styles.primaryButton}>Explore products</Link></div></section>;

  return <section className={styles.cartPage}>
    <div className={styles.container}>
      <div className={styles.headingRow}><h1>Your Cart <span>({cartProducts.length} {cartProducts.length === 1 ? "item" : "items"})</span></h1></div>
      <div className={styles.layout}>
        <div className={styles.itemsPanel}>
          <div className={styles.delivery}><div><strong>Delivering to</strong><p>Enter your PIN code to check delivery availability.</p></div><div className={styles.pinForm}><input value={pinCode} onChange={(event) => setPinCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="Enter PIN code" aria-label="Delivery PIN code" /><button type="button" disabled={pinCode.length !== 6}>Locate</button></div></div>
          {cartProducts.map((product) => <article className={styles.item} key={product.id}>
            <Link href={productHref(product)} className={styles.image}><Image alt={product.title || "Product"} src={product.imgSrc || "/images/placeholder.svg"} fill sizes="(max-width: 767px) 96px, 168px" /></Link>
            <div className={styles.itemInfo}><Link href={productHref(product)} className={styles.productName}>{product.title || "Product"}</Link><p className={styles.options}>{options(product)}</p><p className={styles.price}>{money(product.price)} <span>each</span></p><div className={styles.quantity}><span>Qty</span><button type="button" onClick={() => dispatch(updateQuantity({ id: product.id, qty: product.quantity - 1 }))} disabled={product.quantity <= 1} aria-label="Decrease quantity">−</button><strong>{product.quantity}</strong><button type="button" onClick={() => dispatch(updateQuantity({ id: product.id, qty: product.quantity + 1 }))} aria-label="Increase quantity">+</button></div><p className={styles.deliveryNote}>Delivery details will be confirmed at checkout.</p></div>
            <div className={styles.itemTotal}><strong>{money(product.price * product.quantity)}</strong><button type="button" onClick={() => dispatch(removeProduct({ id: product.id }))}>Remove</button></div>
          </article>)}
        </div>
        <aside className={styles.summary}>
          <h2>Cart Summary</h2>
          <div className={styles.summaryRow}><span>MRP ({cartProducts.length} {cartProducts.length === 1 ? "item" : "items"})</span><strong>{money(totalPrice)}</strong></div>
          <div className={styles.summaryRow}><span>Delivery</span><strong className={styles.green}>Included</strong></div>
          <div className={styles.rule} />
          <div className={styles.total}><span>You pay</span><strong>{money(totalPrice)}</strong></div>
          <p className={styles.saveNote}>✓ Secure checkout · Final total and stock are confirmed before payment.</p>
          <div className={styles.help}><strong>Need help?</strong><span>Our team can help with your order.</span></div>
          <Link href={user ? "/checkout" : "/login"} className={styles.primaryButton}>{user ? "Proceed to checkout" : "Login to proceed"}</Link>
          {!user && <p className={styles.loginNote}>Sign in to choose a saved delivery address and complete payment.</p>}
        </aside>
      </div>
    </div>
  </section>;
}
