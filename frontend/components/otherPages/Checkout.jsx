"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { useAppState } from "@/context/useAppState";
import { useToast } from "@/components/common/ToastContext";
import { getAllAddresses } from "@/services/address/address.service";
import { createCheckout } from "@/services/checkout/checkout.service";
import styles from "./Checkout.module.css";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const productHref = (product) => product.slug ? `/product/${product.slug}` : `/product-detail/${product.id}`;
const paymentOptions = [
  { id: "upi", title: "UPI", detail: "Pay securely with any UPI app." },
  { id: "card", title: "Credit or debit card", detail: "Visa, Mastercard, RuPay and more." },
  { id: "cod", title: "Cash on delivery", detail: "Pay one-third now; the remaining balance is due on delivery." },
];

export default function Checkout() {
  const { cartProducts, totalPrice } = useAppState();
  const toast = useToast();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const idempotencyKey = useRef(null);
  const total = Number(totalPrice || 0);
  const codAdvance = Math.ceil(total * 100 / 3) / 100;
  const codBalance = total - codAdvance;
  const selectedAddress = addresses.find((address) => String(address._id) === addressId);

  useEffect(() => {
    getAllAddresses().then((response) => {
      const list = response.data || [];
      setAddresses(list);
      setAddressId(String((list.find((address) => address.isDefault) || list[0])?._id || ""));
    }).catch(() => toast("Unable to load saved addresses.", "error")).finally(() => setIsLoadingAddresses(false));
  }, [toast]);

  const choosePayment = (method) => {
    idempotencyKey.current = null;
    setPaymentMethod(method);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!addressId) return toast("Choose a delivery address first.", "error");
    if (!cashfreeLoaded || !window.Cashfree) return toast("Secure payment is still loading. Please try again.", "error");
    setIsSubmitting(true);
    try {
      const response = await createCheckout({
        addressId,
        paymentMethod,
        idempotencyKey: (idempotencyKey.current ||= crypto.randomUUID()),
        items: cartProducts.map((product) => ({ productId: product.productId || product._id || product.id, quantity: product.quantity, selectedOptions: product.selectedOptions || [] })),
      });
      const paymentSessionId = response.data.order.paymentTransaction?.paymentSessionId;
      if (!paymentSessionId) throw new Error("Payment session was not created");
      window.Cashfree({ mode: response.data.paymentMode }).checkout({ paymentSessionId, redirectTarget: "_self" });
    } catch (error) {
      toast(error?.message || "Unable to start checkout.", "error");
      setIsSubmitting(false);
    }
  };

  if (!cartProducts.length) return <section className={styles.page}><div className={styles.empty}><h1>Your cart is empty</h1><Link className={styles.primaryButton} href="/all-products">Continue shopping</Link></div></section>;

  return <section className={styles.page}>
    <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" onLoad={() => setCashfreeLoaded(true)} />
    <div className={styles.container}>
      <header className={styles.header}><p>Secure checkout</p><h1>Choose payment method</h1><span>Delivery details and final availability are confirmed before payment.</span></header>
      <div className={styles.layout}>
        <main>
          {isLoadingAddresses ? <div className={styles.card}>Loading saved addresses…</div> : !addresses.length ? <div className={`${styles.card} ${styles.noAddress}`}><div><p className={styles.eyebrow}>Delivery address required</p><h2>Add your delivery address first</h2><p>We need an address before showing payment options. It will be saved to your account for future orders.</p></div><Link href="/checkout/address" className={styles.primaryButton}>Add delivery address</Link></div> : <form onSubmit={handleSubmit}>
            <section className={styles.card}>
              <div className={styles.sectionHead}><div><p className={styles.eyebrow}>Delivering to</p><h2>Select an address</h2></div><Link href="/checkout/address">Add new</Link></div>
              <div className={styles.addressList}>{addresses.map((address) => <label className={`${styles.address} ${addressId === String(address._id) ? styles.selected : ""}`} key={address._id}><input type="radio" name="address" value={address._id} checked={addressId === String(address._id)} onChange={(event) => setAddressId(event.target.value)} /><span><strong>{address.label || "Home"}{address.isDefault ? " · Default" : ""}</strong><small>{address.fullName} · {address.phone}</small><small>{address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} — {address.postalCode}</small></span></label>)}</div>
            </section>
            <section className={styles.card}>
              <div className={styles.sectionHead}><div><p className={styles.eyebrow}>Payment</p><h2>How would you like to pay?</h2></div></div>
              <div className={styles.paymentList}>{paymentOptions.map((option) => <label className={`${styles.paymentOption} ${paymentMethod === option.id ? styles.selected : ""}`} key={option.id}><input type="radio" name="paymentMethod" value={option.id} checked={paymentMethod === option.id} onChange={() => choosePayment(option.id)} /><span className={styles.paymentIcon}>{option.id === "upi" ? "₹" : option.id === "card" ? "▣" : "◌"}</span><span><strong>{option.title}</strong><small>{option.detail}</small>{option.id === "cod" && paymentMethod === "cod" && <small className={styles.advance}>Pay {money(codAdvance)} now · {money(codBalance)} on delivery</small>}</span></label>)}</div>
              <button className={styles.primaryButton} type="submit" disabled={isSubmitting || !cashfreeLoaded}>{isSubmitting ? "Starting secure payment…" : paymentMethod === "cod" ? `Pay ${money(codAdvance)} advance` : `Pay ${money(total)}`}</button>
              <p className={styles.paymentNote}>UPI and card payments are completed on Cashfree&apos;s secure checkout. We do not store payment details.</p>
            </section>
          </form>}
        </main>
        <aside className={styles.summary}>
          <h2>Cart summary</h2>
          {selectedAddress && <div className={styles.summaryAddress}><span>Delivering to</span><strong>{selectedAddress.fullName}</strong><small>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</small></div>}
          <div className={styles.items}>{cartProducts.map((product) => <div className={styles.item} key={product.id}><Link href={productHref(product)}><Image alt={product.title || "Product"} src={product.imgSrc || "/images/placeholder.svg"} width={72} height={88} /></Link><span><strong>{product.title || "Product"}</strong><small>Qty {product.quantity}</small></span><b>{money(product.price * product.quantity)}</b></div>)}</div>
          <div className={styles.totalRow}><span>Cart total ({cartProducts.length} {cartProducts.length === 1 ? "item" : "items"})</span><strong>{money(total)}</strong></div>
          <div className={styles.deliveryRow}><span>Delivery</span><strong>Included</strong></div>
          <div className={styles.youPay}><span>{paymentMethod === "cod" ? "Pay today" : "You pay"}</span><strong>{money(paymentMethod === "cod" ? codAdvance : total)}</strong></div>
          {paymentMethod === "cod" && <p className={styles.codNote}>Balance due on delivery: <strong>{money(codBalance)}</strong></p>}
        </aside>
      </div>
    </div>
  </section>;
}
