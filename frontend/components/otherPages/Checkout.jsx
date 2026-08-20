"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/context/useAppState";
import { useToast } from "@/components/common/ToastContext";
import { getAllAddresses } from "@/services/address/address.service";
import { createCheckout, getActiveCheckout, getOrder } from "@/services/checkout/checkout.service";
import { getCoupon } from "@/services/coupon/coupon.service";
import { getMe } from "@/services/user/me.service";
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
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const [cashfreeError, setCashfreeError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [activeCheckout, setActiveCheckout] = useState(null);
  const idempotencyKey = useRef(null);
  const total = Number(totalPrice || 0);
  const couponDiscount = appliedCoupon ? Number((total * appliedCoupon.discountPercent / 100).toFixed(2)) : 0;
  const payableTotal = total - couponDiscount;
  const codAdvance = Math.ceil(payableTotal * 100 / 3) / 100;
  const codBalance = payableTotal - codAdvance;
  const selectedAddress = addresses.find((address) => String(address._id) === addressId);

  useEffect(() => {
    let current = true;
    getMe()
      .then((response) => {
        if (!response.data?.user) throw new Error("Login required");
        if (current) setIsAuthenticated(true);
      })
      .catch(() => router.replace(`/login?next=${encodeURIComponent("/checkout")}`));
    return () => { current = false; };
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let current = true;

    const loadCheckout = async () => {
      try {
        const [addressResponse, activeResponse] = await Promise.all([getAllAddresses(), getActiveCheckout()]);
        if (!current) return;
        const list = addressResponse.data || [];
        setAddresses(list);
        const requestedAddressId = new URLSearchParams(window.location.search).get("addressId");
        const requestedAddress = list.find((address) => String(address._id) === requestedAddressId);
        setAddressId(String((requestedAddress || list.find((address) => address.isDefault) || list[0])?._id || ""));

        const pendingOrder = activeResponse.data?.order;
        if (!pendingOrder) return;
        const latestOrder = (await getOrder(pendingOrder.orderNumber)).data.order;
        if (!current) return;
        if (latestOrder.status === "confirmed") return router.replace(`/my-account-orders-details?order_id=${encodeURIComponent(latestOrder.orderNumber)}`);
        if (latestOrder.status === "pending_payment") setActiveCheckout({ order: latestOrder, paymentMode: activeResponse.data.paymentMode });
      } catch {
        if (current) toast("Unable to load checkout details.", "error");
      } finally {
        if (current) setIsLoadingAddresses(false);
      }
    };

    loadCheckout();
    return () => { current = false; };
  }, [isAuthenticated, router, toast]);

  const choosePayment = (method) => {
    idempotencyKey.current = null;
    setPaymentMethod(method);
  };

  const markCashfreeReady = () => {
    const isReady = typeof window.Cashfree === "function";
    setCashfreeLoaded(isReady);
    setCashfreeError(!isReady);
  };

  const startPayment = (order, paymentMode) => {
    const paymentSessionId = order.paymentTransaction?.paymentSessionId;
    if (!paymentSessionId) {
      toast("This payment session is no longer available. Please start checkout again.", "error");
      return false;
    }
    if (!cashfreeLoaded || !window.Cashfree) {
      toast(cashfreeError ? "Secure payment could not load. Please disable any blocker and retry." : "Secure payment is still loading. Please try again.", "error");
      return false;
    }
    try {
      window.Cashfree({ mode: paymentMode }).checkout({ paymentSessionId, redirectTarget: "_self" });
      return true;
    } catch {
      toast("Unable to open secure payment. Please try again.", "error");
      return false;
    }
  };

  const resumePayment = () => {
    setIsSubmitting(true);
    if (!startPayment(activeCheckout.order, activeCheckout.paymentMode)) setIsSubmitting(false);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return toast("Enter a coupon code.", "error");
    try {
      const response = await getCoupon(couponCode);
      setAppliedCoupon(response.data.coupon);
      setCouponCode(response.data.coupon.code);
      toast(`${response.data.coupon.title}: ${response.data.coupon.discountPercent}% off applied.`, "success");
    } catch (error) {
      setAppliedCoupon(null);
      toast(error?.response?.data?.message || error?.message || "Coupon is invalid or expired.", "error");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!addressId) return toast("Choose a delivery address first.", "error");
    setIsSubmitting(true);
    try {
      const response = await createCheckout({
        addressId,
        paymentMethod,
        couponCode: appliedCoupon?.code,
        idempotencyKey: (idempotencyKey.current ||= crypto.randomUUID()),
        items: cartProducts.map((product) => ({ productId: product.productId || product._id || product.id, quantity: product.quantity, selectedOptions: product.selectedOptions || [] })),
      });
      if (!startPayment(response.data.order, response.data.paymentMode)) setIsSubmitting(false);
    } catch (error) {
      idempotencyKey.current = null;
      toast(error?.response?.data?.message || error?.message || "Unable to start checkout.", "error");
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated === null) return <section className={styles.page}><div className={styles.empty}>Checking your account…</div></section>;
  if (!isAuthenticated) return null;
  if (!cartProducts.length && !activeCheckout) return <section className={styles.page}><div className={styles.empty}><h1>Your cart is empty</h1><Link className={styles.primaryButton} href="/all-products">Continue shopping</Link></div></section>;

  return <section className={styles.page}>
    <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" onLoad={markCashfreeReady} onReady={markCashfreeReady} onError={() => setCashfreeError(true)} />
    <div className={styles.container}>
      <div className={styles.header}><p>Secure checkout</p><h1>Choose payment method</h1><span>Delivery details and final availability are confirmed before payment.</span></div>
      <div className={styles.layout}>
        <main>
          {isLoadingAddresses ? <div className={styles.card}>Loading saved addresses…</div> : activeCheckout ? <section className={styles.card}><div className={styles.sectionHead}><div><p className={styles.eyebrow}>Payment not finished</p><h2>Resume your secure payment</h2></div></div><p>Your order #{activeCheckout.order.orderNumber} is reserved until {new Date(activeCheckout.order.expiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. Resume the same Cashfree session to complete payment.</p><button className={styles.primaryButton} type="button" disabled={isSubmitting} onClick={resumePayment}>{isSubmitting ? "Opening secure payment…" : "Resume secure payment"}</button><Link className={styles.secondaryLink} href={`/my-account-orders-details?order_id=${encodeURIComponent(activeCheckout.order.orderNumber)}`}>View order details</Link></section> : !addresses.length ? <div className={`${styles.card} ${styles.noAddress}`}><div><p className={styles.eyebrow}>Delivery address required</p><h2>Add your delivery address first</h2><p>We need an address before showing payment options. It will be saved to your account for future orders.</p></div><Link href="/checkout/address" className={styles.primaryButton}>Add delivery address</Link></div> : <form onSubmit={handleSubmit}>
            <section className={styles.card}>
              <div className={styles.sectionHead}><div><p className={styles.eyebrow}>Delivering to</p><h2>Select an address</h2></div><Link href="/checkout/address">Add new</Link></div>
              <div className={styles.addressList}>{addresses.map((address) => <label className={`${styles.address} ${addressId === String(address._id) ? styles.selected : ""}`} key={address._id}><input type="radio" name="address" value={address._id} checked={addressId === String(address._id)} onChange={(event) => setAddressId(event.target.value)} /><span><strong>{address.label || "Home"}{address.isDefault ? " · Default" : ""}</strong><small>{address.fullName} · {address.phone}</small><small>{address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} — {address.postalCode}</small></span></label>)}</div>
            </section>
            <section className={styles.card}>
              <div className={styles.sectionHead}><div><p className={styles.eyebrow}>Payment</p><h2>How would you like to pay?</h2></div></div>
              <div className={styles.paymentList}>{paymentOptions.map((option) => <label className={`${styles.paymentOption} ${paymentMethod === option.id ? styles.selected : ""}`} key={option.id}><input type="radio" name="paymentMethod" value={option.id} checked={paymentMethod === option.id} onChange={() => choosePayment(option.id)} /><span className={styles.paymentIcon}>{option.id === "upi" ? "₹" : option.id === "card" ? "▣" : "◌"}</span><span><strong>{option.title}</strong><small>{option.detail}</small>{option.id === "cod" && paymentMethod === "cod" && <small className={styles.advance}>Pay {money(codAdvance)} now · {money(codBalance)} on delivery</small>}</span></label>)}</div>
              <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>{isSubmitting ? "Starting secure payment…" : paymentMethod === "cod" ? `Pay ${money(codAdvance)} advance` : `Pay ${money(payableTotal)}`}</button>
              <p className={styles.paymentNote}>UPI and card payments are completed on Cashfree&apos;s secure checkout. We do not store payment details.</p>
            </section>
          </form>}
        </main>
        <aside className={styles.summary}>
          <h2>Cart summary</h2>
          {selectedAddress && <div className={styles.summaryAddress}><span>Delivering to</span><strong>{selectedAddress.fullName}</strong><small>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</small></div>}
          <div className={styles.items}>{cartProducts.map((product) => <div className={styles.item} key={product.id}><Link href={productHref(product)}><Image alt={product.title || "Product"} src={product.imgSrc || "/images/placeholder.svg"} width={72} height={88} /></Link><span><strong>{product.title || "Product"}</strong><small>Qty {product.quantity}</small></span><b>{money(product.price * product.quantity)}</b></div>)}</div>
          <div className={styles.coupon}><label htmlFor="couponCode">Have a coupon?</label><div><input id="couponCode" value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setAppliedCoupon(null); }} placeholder="Enter code" /><button type="button" onClick={applyCoupon}>Apply</button></div>{appliedCoupon && <small><strong>{appliedCoupon.title}</strong> — {appliedCoupon.description} · {appliedCoupon.discountPercent}% off</small>}</div>
          <div className={styles.totalRow}><span>Cart total ({cartProducts.length} {cartProducts.length === 1 ? "item" : "items"})</span><strong>{money(total)}</strong></div>
          {appliedCoupon && <div className={styles.discountRow}><span>Coupon discount</span><strong>−{money(couponDiscount)}</strong></div>}
          <div className={styles.deliveryRow}><span>Delivery</span><strong>Included</strong></div>
          <div className={styles.youPay}><span>{paymentMethod === "cod" ? "Pay today" : "You pay"}</span><strong>{money(paymentMethod === "cod" ? codAdvance : payableTotal)}</strong></div>
          {paymentMethod === "cod" && <p className={styles.codNote}>Balance due on delivery: <strong>{money(codBalance)}</strong></p>}
        </aside>
      </div>
    </div>
  </section>;
}
