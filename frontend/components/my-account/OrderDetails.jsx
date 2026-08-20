"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrder } from "@/services/checkout/checkout.service";
import styles from "./OrderDetails.module.css";

const money = (paise) => `₹${(Number(paise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const label = (value) => String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const dateTime = (value) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const paymentMethod = { upi: "UPI", card: "Credit or debit card", cod: "Cash on delivery" };

const deliveryLines = (address) => {
  const value = (field) => String(address[field] || "").trim();
  const line1 = value("line1");
  const city = value("city");
  const location = [line1.toLowerCase().includes(city.toLowerCase()) ? "" : city, value("state"), value("postalCode")].filter(Boolean).join(", ");
  const line2 = value("line2");
  const repeatsLocation = [value("city"), value("state"), value("postalCode"), value("country")]
    .filter(Boolean)
    .some((part) => line2.toLowerCase().includes(part.toLowerCase()));

  return [line1, line2 && !repeatsLocation ? line2 : "", value("landmark"), location, value("country")].filter(Boolean);
};

export default function OrderDetails() {
  const orderId = useSearchParams().get("order_id");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return setError("Choose an order from My Orders to view its details.");
    getOrder(orderId).then((response) => setOrder(response.data.order)).catch(() => setError("We could not find that order."));
  }, [orderId]);

  if (error) return <div className="my-account-content"><p>{error}</p><Link className="tf-btn btn-fill radius-4 mt-3" href="/my-account-orders"><span className="text">My orders</span></Link></div>;
  if (!order) return <div className="my-account-content">Loading order details…</div>;

  const address = order.addressSnapshot || {};
  const addressLines = deliveryLines(address);

  return (
    <div className="my-account-content">
      <div className="account-order-details">
        <div className="wd-form-order">
          <div className="order-head">
            {order.items[0]?.image && <figure className="img-product"><img src={order.items[0].image} alt={order.items[0].title} /></figure>}
            <div className="content">
              <div className="badge">{label(order.status)}</div>
              <h6 className="mt-8 fw-5">Order #{order.orderNumber}</h6>
              <p className="text-2 mt_4">Placed on {dateTime(order.createdAt)}</p>
            </div>
          </div>

          <div className="tf-grid-layout md-col-2 gap-15">
            <div className="item"><div className="text-2 text_black-2">Payment method</div><div className="text-2 mt_4 fw-6">{paymentMethod[order.paymentMethod] || label(order.paymentMethod)}</div></div>
            <div className="item"><div className="text-2 text_black-2">Payment status</div><div className="text-2 mt_4 fw-6">{label(order.paymentStatus)}</div></div>
            <div className="item"><div className="text-2 text_black-2">Items</div><div className="text-2 mt_4 fw-6">{order.items.length} {order.items.length === 1 ? "item" : "items"}</div></div>
            <div className="item"><div className="text-2 text_black-2">Order total</div><div className="text-2 mt_4 fw-6">{money(order.pricing?.totalPaise)}</div></div>
          </div>

          <div className="widget-tabs style-3 widget-order-tab">
            <div className="widget-content-tab">
              <div className="widget-content-inner active">
                <h6 className="mb_20">Items in your order</h6>
                {order.items.map((item, index) => <div className="order-head" key={`${item.product}-${index}`}>
                  {item.image && <figure className="img-product"><img src={item.image} alt={item.title} /></figure>}
                  <div className="content flex-grow-1">
                    <div className="text-2 fw-6">{item.title}</div>
                    <div className="text-2 mt_4">Quantity: {item.quantity}</div>
                    {item.selectedOptions?.length > 0 && <div className="text-2 mt_4">{item.selectedOptions.map((option) => `${option.label || label(option.key)}: ${option.value}`).join(" · ")}</div>}
                  </div>
                  <div className="fw-6">{money(item.unitPricePaise * item.quantity)}</div>
                </div>)}

                <div className={styles.detailsGrid}>
                  <div className={`item ${styles.panel}`}>
                    <div className="text-2 text_black-2">Delivery address</div>
                    <div className="text-2 mt_4 fw-6">{address.fullName || "—"}</div>
                    {addressLines.map((line) => <div className={`text-2 ${styles.addressLine}`} key={line}>{line}</div>)}
                    {address.phone && <div className="text-2 mt_4">Phone: {address.phone}</div>}
                  </div>
                  <div className={`item ${styles.panel}`}>
                    <div className="text-2 text_black-2">Order summary</div>
                    <ul className={`${styles.summary} mt_8`}>
                      <li className="d-flex justify-content-between text-2"><span>Subtotal</span><span>{money(order.pricing?.subtotalPaise)}</span></li>
                      {order.pricing?.discountPaise > 0 && <li className="d-flex justify-content-between text-2 mt_4"><span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span><span>−{money(order.pricing.discountPaise)}</span></li>}
                      <li className="d-flex justify-content-between text-2 mt_4"><span>Delivery</span><span>{order.pricing?.shippingPaise ? money(order.pricing.shippingPaise) : "Included"}</span></li>
                      {order.pricing?.taxPaise > 0 && <li className="d-flex justify-content-between text-2 mt_4"><span>Tax</span><span>{money(order.pricing.taxPaise)}</span></li>}
                      <li className={`d-flex justify-content-between text-2 mt_8 pt_8 line-bt ${styles.total}`}><span className="fw-6">Order total</span><span className="fw-6">{money(order.pricing?.totalPaise)}</span></li>
                      {order.pricing?.advancePaise > 0 && <li className="d-flex justify-content-between text-2 mt_4"><span>Paid today</span><span>{money(order.pricing.advancePaise)}</span></li>}
                      {order.pricing?.balanceDuePaise > 0 && <li className="d-flex justify-content-between text-2 mt_4"><span>Balance due on delivery</span><span>{money(order.pricing.balanceDuePaise)}</span></li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.actions}><Link className="tf-btn btn-fill radius-4" href="/my-account-orders"><span className="text">Back to my orders</span></Link></div>
        </div>
      </div>
    </div>
  );
}
