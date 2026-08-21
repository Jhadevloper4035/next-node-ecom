"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useAppState } from "@/context/useAppState";
import { useToast } from "@/components/common/ToastContext";
import { clearCart, removeInvalidProducts } from "@/redux/cartSlice";
import { getAllAddresses } from "@/services/address/address.service";
import { cancelCheckout, createCheckout, getActiveCheckout, getOrder, retryCheckout } from "@/services/checkout/checkout.service";
import { getCoupon } from "@/services/coupon/coupon.service";
import { getMe } from "@/services/user/me.service";
import styles from "./Checkout.module.css";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const paymentOptions = [
  { id: "upi", title: "UPI", detail: "Pay securely with any UPI app." },
  { id: "card", title: "Credit or debit card", detail: "Visa, Mastercard, RuPay and more." },
  { id: "cod", title: "Cash on delivery", detail: "Pay one-third now; the remaining balance is due on delivery." },
];
const paymentAttempt = (order) => order?.activePaymentTransaction || order?.paymentTransaction;
const sameId = (left, right) => String(left || "") === String(right || "");

function cartPricing(items, coupon) {
  const lines = items.map((item) => ({
    item,
    subtotalPaise: Math.round(Number(item.price || 0) * Number(item.quantity || 0) * 100),
    gstPercent: Number(item.gstPercent ?? 18),
  }));
  const subtotalPaise = lines.reduce((sum, line) => sum + line.subtotalPaise, 0);
  const restricted = coupon && ((coupon.allowedProductIds || []).length || (coupon.allowedCategoryIds || []).length);
  const eligibleLines = coupon ? lines.filter(({ item }) => !restricted || (coupon.allowedProductIds || []).some((id) => sameId(id, item.productId || item.product)) || (coupon.allowedCategoryIds || []).some((id) => sameId(id, item.category))) : [];
  let eligibleSubtotalPaise = eligibleLines.reduce((sum, line) => sum + line.subtotalPaise, 0);
  let discountPaise = coupon && eligibleSubtotalPaise ? Math.min(Math.floor(eligibleSubtotalPaise * Number(coupon.discountPercent || 0) / 100), Number(coupon.maxDiscountPaise || Infinity)) : 0;
  let remainingDiscountPaise = discountPaise;
  const eligible = new Set(eligibleLines);
  const taxPaise = lines.reduce((sum, line) => {
    let lineDiscountPaise = 0;
    if (eligible.has(line)) {
      lineDiscountPaise = eligibleSubtotalPaise === line.subtotalPaise
        ? remainingDiscountPaise
        : Math.floor(remainingDiscountPaise * line.subtotalPaise / eligibleSubtotalPaise);
      eligibleSubtotalPaise -= line.subtotalPaise;
      remainingDiscountPaise -= lineDiscountPaise;
    }
    return sum + Math.round((line.subtotalPaise - lineDiscountPaise) * line.gstPercent / 100);
  }, 0);

  return { subtotalPaise, discountPaise, taxPaise, totalPaise: subtotalPaise - discountPaise + taxPaise };
}

export default function Checkout() {
  const { cartProducts } = useAppState();
  const dispatch = useDispatch();
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
  const estimatedPricing = cartPricing(cartProducts, appliedCoupon);
  const total = estimatedPricing.subtotalPaise / 100;
  const couponDiscount = estimatedPricing.discountPaise / 100;
  const estimatedTax = estimatedPricing.taxPaise / 100;
  const payableTotal = estimatedPricing.totalPaise / 100;
  const codAdvance = Math.ceil(payableTotal * 100 / 3) / 100;
  const codBalance = payableTotal - codAdvance;
  const selectedAddress = addresses.find((address) => String(address._id) === addressId);
  const activePayment = paymentAttempt(activeCheckout?.order);
  const activePaymentStatus = activePayment?.status;
  const isPendingPayment = activePaymentStatus === "pending" && Boolean(activePayment?.cfPaymentId);
  const canRetryPayment = ["failed", "user_dropped"].includes(activePaymentStatus);
  const reservedPricing = activeCheckout?.order?.pricing;
  const summaryItems = activeCheckout ? activeCheckout.order.items || [] : cartProducts;
  const summarySubtotal = reservedPricing ? reservedPricing.subtotalPaise / 100 : total;
  const summaryDiscount = reservedPricing ? reservedPricing.discountPaise / 100 : couponDiscount;
  const summaryShipping = reservedPricing ? reservedPricing.shippingPaise / 100 : 0;
  const summaryTax = reservedPricing ? reservedPricing.taxPaise / 100 : estimatedTax;
  const summaryTotal = reservedPricing ? reservedPricing.totalPaise / 100 : payableTotal;
  const summaryAdvance = reservedPricing ? reservedPricing.advancePaise / 100 : codAdvance;
  const summaryBalance = reservedPricing ? reservedPricing.balanceDuePaise / 100 : codBalance;
  const summaryPaymentMethod = activeCheckout?.order?.paymentMethod || paymentMethod;

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
    if (cartProducts.length) setActiveCheckout(null);
  }, [cartProducts.length]);

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
        if (latestOrder.status === "pending_payment" && !cartProducts.length) {
          dispatch(clearCart());
          setActiveCheckout({ order: latestOrder, paymentMode: activeResponse.data.paymentMode });
        }
      } catch {
        if (current) toast("Unable to load checkout details.", "error");
      } finally {
        if (current) setIsLoadingAddresses(false);
      }
    };

    loadCheckout();
    return () => { current = false; };
  }, [cartProducts.length, dispatch, isAuthenticated, router, toast]);

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
    const paymentSessionId = paymentAttempt(order)?.paymentSessionId;
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

  const retryPayment = async () => {
    setIsSubmitting(true);
    try {
      const response = await retryCheckout(activeCheckout.order.orderNumber);
      const nextOrder = response.data.order;
      setActiveCheckout({ order: nextOrder, paymentMode: response.data.paymentMode });
      if (!startPayment(nextOrder, response.data.paymentMode)) setIsSubmitting(false);
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Unable to start another payment attempt.";
      if (/expired/i.test(message)) setActiveCheckout(null);
      toast(message, "error");
      setIsSubmitting(false);
    }
  };

  const cancelCurrentCheckout = async () => {
    setIsSubmitting(true);
    try {
      await cancelCheckout(activeCheckout.order.orderNumber);
      idempotencyKey.current = null;
      setActiveCheckout(null);
      toast("Checkout cancelled. You can now update your order and start again.", "success");
    } catch (error) {
      toast(error?.response?.data?.message || error?.message || "Unable to cancel the active checkout.", "error");
    } finally {
      setIsSubmitting(false);
    }
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
    if (cartProducts.some((product) => !/^[a-f\d]{24}$/i.test(String(product.productId || product.product || product._id || product.id || "")))) {
      dispatch(removeInvalidProducts());
      return toast("An unavailable item was removed from your cart. Add it again to continue.", "error");
    }
    setIsSubmitting(true);
    try {
      const response = await createCheckout({
        addressId,
        paymentMethod,
        couponCode: appliedCoupon?.code,
        idempotencyKey: (idempotencyKey.current ||= crypto.randomUUID()),
        items: cartProducts.map((product) => ({ productId: product.productId || product.product || product._id || product.id, quantity: product.quantity, selectedOptions: product.selectedOptions || [] })),
      });
      dispatch(clearCart());
      if (response.data.order.status === "confirmed") {
        return router.replace(`/my-account-orders-details?order_id=${encodeURIComponent(response.data.order.orderNumber)}`);
      }
      setActiveCheckout({ order: response.data.order, paymentMode: response.data.paymentMode });
      if (!startPayment(response.data.order, response.data.paymentMode)) setIsSubmitting(false);
    } catch (error) {
      idempotencyKey.current = null;
      toast(error?.response?.data?.message || error?.message || "Unable to start checkout.", "error");
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated === null) return <section className={styles.page}><div className={styles.empty}>Checking your account…</div></section>;
  if (!isAuthenticated) return null;
  if (!cartProducts.length && !activeCheckout) return <section className={styles.page}><div className={styles.empty}><p className={styles.eyebrow}>Checkout</p><h1>Nothing is ready for checkout</h1><p className={styles.emptyCopy}>Add a product to your cart, then return here to choose delivery and payment.</p><Link className={styles.primaryButton} href="/all-products">Explore furniture</Link><Link className={styles.emptyLink} href="/shopping-cart">View cart</Link></div></section>;

  return <section className={styles.page}>
    <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" onLoad={markCashfreeReady} onReady={markCashfreeReady} onError={() => setCashfreeError(true)} />
    <div className={styles.container}>
      <div className={styles.header}><p>Secure checkout</p><h1>Choose payment method</h1><span>Delivery details and final availability are confirmed before payment.</span></div>
      <div className={styles.layout}>
        <main>
          {isLoadingAddresses ? <div className={styles.card}>Loading saved addresses…</div> : activeCheckout ? <section className={styles.card}>
            <div className={styles.sectionHead}><div><p className={styles.eyebrow}>Payment not finished</p><h2>{isPendingPayment ? "Payment is being verified" : canRetryPayment ? "Try your payment again" : "Resume your secure payment"}</h2></div></div>
            <p>Your order #{activeCheckout.order.orderNumber} is reserved until {new Date(activeCheckout.order.expiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}. {isPendingPayment ? "We are confirming your payment with Cashfree. Do not pay again while its status is uncertain." : canRetryPayment ? "Start a new payment attempt to complete your order." : "Resume the same Cashfree session to complete payment."}</p>
            <div className={styles.reservedOrder}><strong>Reserved order #{activeCheckout.order.orderNumber}</strong>{activeCheckout.order.items?.map((item) => <span key={item._id || `${item.product}-${item.title}`}>{item.title} · Qty {item.quantity} · {money(item.unitPricePaise * item.quantity / 100)}</span>)}<small>Delivering to {activeCheckout.order.addressSnapshot?.fullName}, {activeCheckout.order.addressSnapshot?.line1}, {activeCheckout.order.addressSnapshot?.city}</small></div>
            {isPendingPayment ? <button className={styles.primaryButton} type="button" disabled>Payment is being verified</button> : <button className={styles.primaryButton} type="button" disabled={isSubmitting} onClick={canRetryPayment ? retryPayment : resumePayment}>{isSubmitting ? "Opening secure payment…" : canRetryPayment ? "Try payment again" : "Resume secure payment"}</button>}
            {!isPendingPayment && <button className={styles.cancelButton} type="button" disabled={isSubmitting} onClick={cancelCurrentCheckout}>Cancel checkout and start new</button>}
            <Link className={styles.secondaryLink} href={`/my-account-orders-details?order_id=${encodeURIComponent(activeCheckout.order.orderNumber)}`}>View order details</Link>
          </section> : !addresses.length ? <div className={`${styles.card} ${styles.noAddress}`}><div><p className={styles.eyebrow}>Delivery address required</p><h2>Add your delivery address first</h2><p>We need an address before showing payment options. It will be saved to your account for future orders.</p></div><Link href="/checkout/address" className={styles.primaryButton}>Add delivery address</Link></div> : <form onSubmit={handleSubmit}>
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
          <h2>{activeCheckout ? "Reserved order summary" : "Cart summary"}</h2>
          {selectedAddress && <div className={styles.summaryAddress}><span>Delivering to</span><strong>{selectedAddress.fullName}</strong><small>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</small></div>}
          <div className={styles.items}>{summaryItems.map((product) => <div className={styles.item} key={String(product.id || product._id || product.product)}><Image alt={product.title || "Product"} src={activeCheckout ? product.image || "/images/placeholder.svg" : product.imgSrc || "/images/placeholder.svg"} width={72} height={88} /><span><strong>{product.title || "Product"}</strong><small>Qty {product.quantity}</small></span><b>{money(activeCheckout ? product.unitPricePaise * product.quantity / 100 : product.price * product.quantity)}</b></div>)}</div>
          {!activeCheckout && <div className={styles.coupon}><label htmlFor="couponCode">Have a coupon?</label><div><input id="couponCode" value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setAppliedCoupon(null); }} placeholder="Enter code" /><button type="button" onClick={applyCoupon}>Apply</button></div>{appliedCoupon && <small><strong>{appliedCoupon.title}</strong> — {appliedCoupon.description} · {appliedCoupon.discountPercent}% off</small>}</div>}
          <div className={styles.totalRow}><span>{activeCheckout ? "Order total" : "Cart total"} ({summaryItems.length} {summaryItems.length === 1 ? "item" : "items"})</span><strong>{money(summarySubtotal)}</strong></div>
          {summaryDiscount > 0 && <div className={styles.discountRow}><span>{activeCheckout ? "Coupon discount" : "Estimated coupon discount"}</span><strong>−{money(summaryDiscount)}</strong></div>}
          <div className={styles.deliveryRow}><span>Delivery</span><strong>{summaryShipping > 0 ? money(summaryShipping) : "Included"}</strong></div>
          {summaryTax > 0 && <div className={styles.deliveryRow}><span>{activeCheckout ? "GST" : "Estimated GST"}</span><strong>{money(summaryTax)}</strong></div>}
          <div className={styles.youPay}><span>{summaryPaymentMethod === "cod" ? "Pay today" : "You pay"}</span><strong>{money(summaryPaymentMethod === "cod" ? summaryAdvance : summaryTotal)}</strong></div>
          {summaryPaymentMethod === "cod" && <p className={styles.codNote}>Balance due on delivery: <strong>{money(summaryBalance)}</strong></p>}
        </aside>
      </div>
    </div>
  </section>;
}
