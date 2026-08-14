"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { useAppState } from "@/context/useAppState";
import { useToast } from "@/components/common/ToastContext";
import { getAllAddresses } from "@/services/address/address.service";
import { createCheckout } from "@/services/checkout/checkout.service";

const productHref = (product) => product.slug ? `/product/${product.slug}` : `/product-detail/${product.id}`;
const productOptions = (product) => product.selectedOptions?.map((option) => `${option.label}: ${option.value}`).join(" / ") || "Standard";

export default function Checkout() {
  const { cartProducts, totalPrice } = useAppState();
  const toast = useToast();
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const idempotencyKey = useRef(null);

  useEffect(() => {
    getAllAddresses().then((response) => {
      const list = response.data || [];
      setAddresses(list);
      setAddressId(String((list.find((address) => address.isDefault) || list[0])?._id || ""));
    }).catch(() => toast("Unable to load saved addresses.", "error"));
  }, [toast]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!addressId) return toast("Choose a delivery address first.", "error");
    if (!cashfreeLoaded || !window.Cashfree) return toast("Secure payment is still loading. Please try again.", "error");
    setIsSubmitting(true);
    try {
      const response = await createCheckout({
        addressId,
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

  if (!cartProducts.length) return <section className="flat-spacing"><div className="container text-center"><h3>Your cart is empty</h3><Link className="tf-btn btn-reset mt-3" href="/all-products"><span className="text">Continue shopping</span></Link></div></section>;

  return (
    <section>
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" onLoad={() => setCashfreeLoaded(true)} />
      <div className="container">
        <div className="row">
          <div className="col-xl-6">
            <form className="flat-spacing tf-page-checkout" onSubmit={handleSubmit}>
              <div className="wrap">
                <h5 className="title">Delivery address</h5>
                <div className="info-box">
                  {addresses.length ? addresses.map((address) => (
                    <label className="d-block mb-3" key={address._id}>
                      <input type="radio" name="address" value={address._id} checked={addressId === String(address._id)} onChange={(event) => setAddressId(event.target.value)} /> <strong>{address.label}</strong> — {address.line1}, {address.city}, {address.state} {address.postalCode}
                    </label>
                  )) : <p>Add a saved address before checkout. <Link href="/my-account-address">Manage addresses</Link></p>}
                </div>
              </div>
              <div className="wrap">
                <h5 className="title">Payment</h5>
                <p className="text-secondary">Your final INR total is verified by the server before Cashfree opens.</p>
                <button className="tf-btn btn-reset" type="submit" disabled={isSubmitting || !addressId || !cashfreeLoaded}><span className="text">{isSubmitting ? "Starting payment…" : "Pay securely"}</span></button>
              </div>
            </form>
          </div>
          <div className="col-xl-1"><div className="line-separation" /></div>
          <div className="col-xl-5">
            <div className="flat-spacing flat-sidebar-checkout">
              <div className="sidebar-checkout-content">
                <h5 className="title">Order summary</h5>
                <div className="list-product">
                  {cartProducts.map((product) => (
                    <div key={product.id} className="item-product">
                      <Link href={productHref(product)} className="img-product"><Image alt={product.title} src={product.imgSrc || "/images/placeholder.svg"} width={600} height={800} /></Link>
                      <div className="content-box"><div className="info"><Link href={productHref(product)} className="name-product link text-title">{product.title}</Link><div className="variant text-caption-1 text-secondary">{productOptions(product)}</div></div><div className="total-price text-button"><span className="count">{product.quantity}</span> × <span className="price">₹{Number(product.price || 0).toFixed(2)}</span></div></div>
                    </div>
                  ))}
                </div>
                <div className="sec-total-price"><div className="top"><div className="item d-flex align-items-center justify-content-between text-button"><span>Cart estimate</span><span>₹{totalPrice.toFixed(2)}</span></div><div className="item d-flex align-items-center justify-content-between text-button"><span>Delivery</span><span>Included</span></div></div><div className="bottom"><h5 className="d-flex justify-content-between"><span>Server total</span><span className="total-price-checkout">Calculated at payment</span></h5></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
